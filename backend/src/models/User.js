/**
 * User Model
 * 
 * Handles user authentication, authorization, and user management
 * for the MetroPower Dashboard application.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config/app');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');

class User {
  /**
   * Authenticate user with email/username and password
   * @param {string} identifier - Email or username
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} Authentication result with user and tokens
   */
  static async authenticate(identifier, password) {
    try {
      // Find user by email or username
      const result = await query(
        'SELECT * FROM users WHERE email = $1 OR username = $1',
        [identifier]
      );

      logger.debug('User query result', {
        identifier,
        rowCount: result.rowCount,
        hasRows: result.rows.length > 0,
        user: result.rows[0] ? { ...result.rows[0], password_hash: '[HIDDEN]' } : null
      });

      if (result.rows.length === 0) {
        logger.warn('Authentication failed - user not found', { identifier });
        return null;
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        logger.warn('Authentication failed - user inactive', {
          userId: user.user_id,
          identifier
        });
        return null;
      }

      // Verify password - make sure password_hash exists
      if (!user.password_hash) {
        logger.error('User has no password hash', { userId: user.user_id, identifier });
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logger.warn('Authentication failed - invalid password', {
          userId: user.user_id,
          identifier
        });
        return null;
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user.user_id]
      );

      // Generate tokens
      const tokens = User.generateTokens(user);

      // Remove password hash from user object
      delete user.password_hash;

      logger.info('User authenticated successfully', {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      return {
        user,
        ...tokens
      };

    } catch (error) {
      logger.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async getById(userId) {
    try {
      const result = await query(
        'SELECT user_id, username, email, first_name, last_name, role, is_active, last_login, created_at, updated_at FROM users WHERE user_id = $1',
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async getByEmail(email) {
    try {
      const result = await query(
        'SELECT user_id, username, email, first_name, last_name, role, is_active, last_login, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    try {
      const {
        username,
        email,
        password,
        first_name,
        last_name,
        role = 'View Only'
      } = userData;

      // Validate required fields
      if (!username || !email || !password || !first_name || !last_name) {
        throw new ValidationError('Missing required fields');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Insert user
      const result = await query(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, username, email, first_name, last_name, role, is_active, created_at, updated_at`,
        [username, email, password_hash, first_name, last_name, role]
      );

      const user = result.rows[0];

      logger.info('User created successfully', {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      return user;

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ValidationError('Username or email already exists');
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user object
   */
  static async update(userId, updateData) {
    try {
      const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      // Add updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramIndex}
         RETURNING user_id, username, email, first_name, last_name, role, is_active, last_login, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = result.rows[0];

      logger.info('User updated successfully', {
        userId: user.user_id,
        username: user.username,
        updatedFields: Object.keys(updateData)
      });

      return user;

    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with password hash
      const result = await query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = result.rows[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [newPasswordHash, userId]
      );

      logger.info('Password changed successfully', { userId });

      return true;

    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens for user
   * @param {Object} user - User object
   * @returns {Object} Access and refresh tokens
   */
  static generateTokens(user) {
    const accessTokenPayload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    const refreshTokenPayload = {
      user_id: user.user_id,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.app.name,
      subject: user.user_id.toString()
    });

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.app.name,
      subject: user.user_id.toString()
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn
    };
  }

  /**
   * Verify and refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Get user
      const user = await User.getById(decoded.user_id);
      if (!user || !user.is_active) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = User.generateTokens(user);

      logger.info('Token refreshed successfully', {
        userId: user.user_id,
        username: user.username
      });

      return {
        user,
        ...tokens
      };

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }
}

module.exports = User;
