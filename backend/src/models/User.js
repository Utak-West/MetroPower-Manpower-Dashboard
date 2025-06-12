/**
 * User Model
 *
 * Handles user authentication, authorization, and management
 * for the MetroPower Dashboard with comprehensive security features.
 *
 * Copyright 2025 The HigherSelf Network
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');
const config = require('../config/app');
const logger = require('../utils/logger');
const { ValidationError, AuthenticationError } = require('../middleware/errorHandler');

class User {
  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  static async findById(userId) {
    try {
      if (global.isDemoMode) {
        const demoService = require('../services/demoService');
        return await demoService.findUserById(userId);
      }

      const result = await query(
        'SELECT user_id, username, email, first_name, last_name, role, is_active, created_at, updated_at, last_login FROM users WHERE user_id = $1',
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username or email
   * @param {string} identifier - Username or email
   * @returns {Promise<Object|null>} User data or null
   */
  static async getByIdentifier(identifier) {
    try {
      if (global.isDemoMode) {
        const demoService = require('../services/demoService');
        return await demoService.findUserByIdentifier(identifier);
      }

      const result = await query(
        'SELECT user_id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at, last_login FROM users WHERE username = $1 OR email = $1',
        [identifier]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by identifier:', error);
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
      const saltRounds = config.security.bcryptRounds;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const insertQuery = `
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, role, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING user_id, username, email, first_name, last_name, role, is_active, created_at
      `;

      const result = await query(insertQuery, [
        username,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        createdBy
      ]);

      const user = result.rows[0];

      logger.info('User created successfully', {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        createdBy
      });

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);

      if (error.code === '23505') {
        throw new ValidationError('Username or email already exists');
      }

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
  static async update(userId, updateData, updatedBy = null) {
    try {
      const allowedFields = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updates.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      // Add updated_by and updated_at
      updates.push(`updated_by = $${paramCount}`, `updated_at = NOW()`);
      values.push(updatedBy);
      paramCount++;

      // Add user ID for WHERE clause
      values.push(userId);

      const updateQuery = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING user_id, username, email, first_name, last_name, role, is_active, updated_at
      `;

      const result = await query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new ValidationError('User not found');
      }

      const user = result.rows[0];

      logger.info('User updated successfully', {
        userId: user.user_id,
        updatedFields: Object.keys(updateData),
        updatedBy
      });

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @param {number} updatedBy - User ID who updated the password
   * @returns {Promise<boolean>} Success status
   */
  static async updatePassword(userId, newPassword, updatedBy = null) {
    try {
      // Hash new password
      const saltRounds = config.security.bcryptRounds;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const result = await query(
        'UPDATE users SET password_hash = $1, updated_by = $2, updated_at = NOW() WHERE user_id = $3',
        [password_hash, updatedBy, userId]
      );

      if (result.rowCount === 0) {
        throw new ValidationError('User not found');
      }

      logger.info('User password updated successfully', {
        userId,
        updatedBy
      });

      return true;
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {number} userId - User ID
   * @param {number} deletedBy - User ID who deleted the user
   * @returns {Promise<boolean>} Success status
   */
  static async delete(userId, deletedBy = null) {
    try {
      const result = await query(
        'UPDATE users SET is_active = false, updated_by = $1, updated_at = NOW() WHERE user_id = $2',
        [deletedBy, userId]
      );

      if (result.rowCount === 0) {
        throw new ValidationError('User not found');
      }

      logger.info('User deleted successfully', {
        userId,
        deletedBy
      });

      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * List all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users list with pagination info
   */
  static async list(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role = null,
        active = null,
        search = null
      } = options;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];
      let paramCount = 1;

      // Build WHERE conditions
      if (role) {
        conditions.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
      }

      if (active !== null) {
        conditions.push(`is_active = $${paramCount}`);
        values.push(active);
        paramCount++;
      }

      if (search) {
        conditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get users
      const usersQuery = `
        SELECT user_id, username, email, first_name, last_name, role, is_active, created_at, updated_at, last_login
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const usersResult = await query(usersQuery, values);

      return {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing users:', error);
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
        logger.warn('Authentication failed - user not found', { identifier });
        return null;
      }

      if (!user.is_active) {
        logger.warn('Authentication failed - user inactive', {
          userId: user.user_id,
          identifier
        });
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
        'UPDATE users SET last_login = NOW() WHERE user_id = $1',
        [user.user_id]
      );

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info('User authentication successful', {
        userId: user.user_id,
        username: user.username,
        role: user.role
      });

      // Remove password hash from user object
      delete user.password_hash;
      user.last_login = new Date().toISOString();

      return {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      logger.error('Authentication error:', error);
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
      issuer: config.jwt.issuer,
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
      issuer: config.jwt.issuer,
      subject: user.user_id.toString()
    });
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Promise<Object|null>} Decoded token data or null
   */
  static async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      if (decoded.type !== 'access') {
        throw new AuthenticationError('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid access token');
      } else {
        logger.error('Access token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Verify refresh token and generate new access token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Promise<Object|null>} New access token or null
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Get fresh user data
      const user = await this.findById(decoded.user_id);

      if (!user || !user.is_active) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      logger.info('Access token refreshed successfully', {
        userId: user.user_id
      });

      return {
        accessToken
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid refresh token');
      } else {
        logger.error('Refresh token verification error:', error);
      }
      return null;
    }
  }
}

module.exports = User;
