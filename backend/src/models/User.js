/**
 * User Model
 * 
 * Handles all database operations related to users in the MetroPower Dashboard.
 * Includes authentication, user management, and role-based access control.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config/app');

class User {
  /**
   * Get all users with optional filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Users data with metadata
   */
  static async getAll(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'last_name', sortOrder = 'ASC' } = pagination;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (filters.role) {
        conditions.push(`role = $${paramIndex++}`);
        params.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        params.push(filters.is_active);
      }

      if (filters.search) {
        conditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Main query (exclude password_hash)
      const usersQuery = `
        SELECT 
          user_id,
          username,
          email,
          first_name,
          last_name,
          role,
          is_active,
          last_login,
          created_at,
          updated_at
        FROM users
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // Remove limit and offset

      const [usersResult, countResult] = await Promise.all([
        query(usersQuery, params),
        query(countQuery, countParams)
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  static async getById(userId) {
    try {
      const userQuery = `
        SELECT 
          user_id,
          username,
          email,
          first_name,
          last_name,
          role,
          is_active,
          last_login,
          created_at,
          updated_at
        FROM users
        WHERE user_id = $1
      `;

      const result = await query(userQuery, [userId]);
      return result.rows[0] || null;

    } catch (error) {
      logger.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user by email or username
   * @param {string} identifier - Email or username
   * @returns {Promise<Object|null>} User data or null
   */
  static async getByIdentifier(identifier) {
    try {
      const userQuery = `
        SELECT 
          user_id,
          username,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active,
          last_login,
          created_at,
          updated_at
        FROM users
        WHERE email = $1 OR username = $1
      `;

      const result = await query(userQuery, [identifier]);
      return result.rows[0] || null;

    } catch (error) {
      logger.error(`Error getting user by identifier ${identifier}:`, error);
      throw error;
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @param {number} createdBy - User ID who created the user
   * @returns {Promise<Object>} Created user data
   */
  static async create(userData, createdBy = null) {
    try {
      const {
        username,
        email,
        password,
        first_name,
        last_name,
        role = 'View Only'
      } = userData;

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, role
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, username, email, first_name, last_name, role, is_active, created_at
      `;

      const params = [username, email, password_hash, first_name, last_name, role];
      const result = await query(insertQuery, params);
      const newUser = result.rows[0];

      logger.logAuth('user_created', {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdBy
      });

      return newUser;

    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - User ID who updated the user
   * @returns {Promise<Object>} Updated user data
   */
  static async update(userId, updateData, updatedBy) {
    try {
      const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
      const updates = [];
      const params = [];
      let paramIndex = 1;

      // Handle password update separately
      if (updateData.password) {
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(updateData.password, saltRounds);
        updates.push(`password_hash = $${paramIndex++}`);
        params.push(password_hash);
      }

      Object.entries(updateData).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramIndex}
        RETURNING user_id, username, email, first_name, last_name, role, is_active, updated_at
      `;

      const result = await query(updateQuery, params);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const updatedUser = result.rows[0];

      logger.logAuth('user_updated', {
        userId,
        updatedFields: Object.keys(updateData),
        updatedBy
      });

      return updatedUser;

    } catch (error) {
      logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Authenticate user
   * @param {string} identifier - Email or username
   * @param {string} password - Password
   * @returns {Promise<Object|null>} User data with tokens or null
   */
  static async authenticate(identifier, password) {
    try {
      const user = await this.getByIdentifier(identifier);
      
      if (!user) {
        logger.logSecurity('login_attempt_invalid_user', { identifier });
        return null;
      }

      if (!user.is_active) {
        logger.logSecurity('login_attempt_inactive_user', { 
          userId: user.user_id,
          identifier 
        });
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        logger.logSecurity('login_attempt_invalid_password', { 
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
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Remove password hash from response
      delete user.password_hash;

      logger.logAuth('user_login_success', {
        userId: user.user_id,
        username: user.username,
        role: user.role
      });

      return {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      };

    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Generate access token
   * @param {Object} user - User data
   * @returns {string} JWT access token
   */
  static generateAccessToken(user) {
    const payload = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.app.name,
      subject: user.user_id.toString()
    });
  }

  /**
   * Generate refresh token
   * @param {Object} user - User data
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(user) {
    const payload = {
      user_id: user.user_id,
      type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.app.name,
      subject: user.user_id.toString()
    });
  }

  /**
   * Verify access token
   * @param {string} token - JWT token
   * @returns {Promise<Object|null>} Decoded token data or null
   */
  static async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (decoded.type !== 'access') {
        return null;
      }

      // Check if user still exists and is active
      const user = await this.getById(decoded.user_id);
      if (!user || !user.is_active) {
        return null;
      }

      return decoded;

    } catch (error) {
      logger.debug('Token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} New tokens or null
   */
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      if (decoded.type !== 'refresh') {
        return null;
      }

      const user = await this.getById(decoded.user_id);
      if (!user || !user.is_active) {
        return null;
      }

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      logger.logAuth('token_refreshed', {
        userId: user.user_id
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      logger.debug('Refresh token verification failed:', error.message);
      return null;
    }
  }

  /**
   * Generate password reset token
   * @param {string} email - User email
   * @returns {Promise<string|null>} Reset token or null
   */
  static async generatePasswordResetToken(email) {
    try {
      const user = await this.getByIdentifier(email);
      if (!user || !user.is_active) {
        return null;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE user_id = $3',
        [resetToken, resetExpires, user.user_id]
      );

      logger.logAuth('password_reset_requested', {
        userId: user.user_id,
        email
      });

      return resetToken;

    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw error;
    }
  }

  /**
   * Reset password using token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  static async resetPassword(token, newPassword) {
    try {
      const user = await query(
        'SELECT user_id FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP',
        [token]
      );

      if (user.rows.length === 0) {
        return false;
      }

      const userId = user.rows[0].user_id;
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      await query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = $2',
        [password_hash, userId]
      );

      logger.logAuth('password_reset_completed', {
        userId
      });

      return true;

    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }
}

module.exports = User;
