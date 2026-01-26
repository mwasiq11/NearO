import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { pool } from '../db/database.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';
import crypto from 'crypto';

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    await pool.execute(
      'INSERT INTO users (id, name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, 'user', false]
    );

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    const verificationId = uuidv4();
    await pool.execute(
      'INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [verificationId, id, verificationToken, expiresAt]
    );

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Store refresh token in database
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const sessionId = uuidv4();
    await pool.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, tokenHash, expiresAt]
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Refresh access token
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Check if refresh token exists in database
    const [sessions] = await pool.execute(
      'SELECT * FROM user_sessions WHERE user_id = ? AND expires_at > NOW()',
      [decoded.id]
    );

    let tokenFound = false;
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.token_hash)) {
        tokenFound = true;
        break;
      }
    }

    if (!tokenFound) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user
    const [users] = await pool.execute(
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = users[0];

    // Generate new access token
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      accessToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      const [sessions] = await pool.execute(
        'SELECT * FROM user_sessions WHERE expires_at > NOW()'
      );

      for (const session of sessions) {
        if (await bcrypt.compare(refreshToken, session.token_hash)) {
          await pool.execute('DELETE FROM user_sessions WHERE id = ?', [session.id]);
          break;
        }
      }
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find verification record
    const [verifications] = await pool.execute(
      'SELECT * FROM email_verifications WHERE token = ? AND expires_at > NOW() AND verified_at IS NULL',
      [token]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const verification = verifications[0];

    // Update user as verified
    await pool.execute(
      'UPDATE users SET is_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
      [verification.user_id]
    );

    // Mark verification as used
    await pool.execute(
      'UPDATE email_verifications SET verified_at = NOW() WHERE id = ?',
      [verification.id]
    );

    // Get user and send welcome email
    const [users] = await pool.execute('SELECT name, email FROM users WHERE id = ?', [verification.user_id]);
    if (users.length > 0) {
      await sendWelcomeEmail(users[0].email, users[0].name);
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const [users] = await pool.execute('SELECT id, name, email FROM users WHERE email = ?', [email]);

    // Don't reveal if email exists or not (security best practice)
    if (users.length > 0) {
      const user = users[0];
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      const resetId = uuidv4();
      await pool.execute(
        'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [resetId, user.id, resetToken, expiresAt]
      );

      await sendPasswordResetEmail(user.email, user.name, resetToken);
    }

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find reset record
    const [resets] = await pool.execute(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used_at IS NULL',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const reset = resets[0];

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.user_id]);

    // Mark reset token as used
    await pool.execute('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [reset.id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
};

