import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { pool } from '../db/database.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } from '../services/emailService.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import crypto from 'crypto';

/**
 * Generate a 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Validation
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (not verified yet)
    await pool.execute(
      'INSERT INTO users (id, name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, normalizedEmail, hashedPassword, 'user', false]
    );

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const otpId = uuidv4();
    await pool.execute(
      'INSERT INTO user_otps (id, user_id, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [otpId, id, otpCode, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(normalizedEmail, name, otpCode);

    // Log signup in audit trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: id,
      actionType: 'user_signup',
      entityType: 'user',
      entityId: id,
      metadata: { name, email: normalizedEmail, role: 'user' },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email for the verification code.',
      userId: id,
      email: normalizedEmail
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login user (for provider/seeker/user role)
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

    // Prevent moderator/admin login via user endpoint
    if (user.role !== 'user') {
      return res.status(403).json({ error: 'Use the appropriate login portal for your role' });
    }

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

    // Log audit trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: user.id,
      actionType: 'user_login',
      entityType: 'user',
      entityId: user.id,
      metadata: { name: user.name, email: user.email, role: user.role },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

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
 * Moderator Login (no signup - only admin can create moderators)
 */
const moderatorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with moderator role
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ? AND role = ?',
      [email, 'moderator']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Moderator account is suspended' });
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

    // Store refresh token
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sessionId = uuidv4();
    await pool.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, tokenHash, expiresAt]
    );

    // Log audit trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: user.id,
      actionType: 'moderator_login',
      entityType: 'moderator',
      entityId: user.id,
      metadata: { name: user.name, email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    res.json({
      message: 'Moderator login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Moderator login error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin Login (no signup - initial setup only)
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with admin role
    const [users] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ? AND role = ?',
      [email, 'admin']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Admin account is suspended' });
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

    // Store refresh token
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sessionId = uuidv4();
    await pool.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, tokenHash, expiresAt]
    );

    // Log audit trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: user.id,
      actionType: 'admin_login',
      entityType: 'admin',
      entityId: user.id,
      metadata: { name: user.name, email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    res.json({
      message: 'Admin login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Admin login error:', error);
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
 * Verify OTP for new user sign-up
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedOtp = String(otp || '').replace(/\D/g, '');

    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(normalizedOtp)) {
      return res.status(400).json({ error: 'OTP must be a 6-digit number' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, name, email, is_verified FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    // Find valid OTP
    const [otps] = await pool.execute(
      'SELECT * FROM user_otps WHERE user_id = ? AND otp_code = ? AND expires_at > NOW() AND verified_at IS NULL ORDER BY created_at DESC LIMIT 1',
      [user.id, normalizedOtp]
    );

    if (otps.length === 0) {
      // Increment attempts
      await pool.execute(
        'UPDATE user_otps SET attempts = attempts + 1 WHERE user_id = ? AND verified_at IS NULL',
        [user.id]
      );
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const otpRecord = otps[0];

    // Check if too many attempts (security measure)
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Mark user as verified
    await pool.execute(
      'UPDATE users SET is_verified = TRUE, email_verified_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Mark OTP as used
    await pool.execute(
      'UPDATE user_otps SET verified_at = NOW() WHERE id = ?',
      [otpRecord.id]
    );

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate tokens (auto-login after verification)
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: 'user'
    });

    // Store refresh token in database
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const sessionId = uuidv4();
    await pool.execute(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, tokenHash, expiresAt]
    );

    // Log audit trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: user.id,
      actionType: 'email_verified',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    res.json({ 
      message: 'Email verified successfully. You are now logged in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'user',
        is_verified: true
      },
      ...tokens
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resend OTP for email verification
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const [users] = await pool.execute(
      'SELECT id, name, email, is_verified FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    // Check for recent OTP (rate limiting)
    const [recentOtps] = await pool.execute(
      'SELECT created_at FROM user_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    if (recentOtps.length > 0) {
      const lastOtpTime = new Date(recentOtps[0].created_at);
      const now = new Date();
      const timeDiff = (now - lastOtpTime) / 1000; // seconds

      if (timeDiff < 60) {
        return res.status(429).json({ 
          error: 'Please wait before requesting a new OTP',
          retryAfter: Math.ceil(60 - timeDiff)
        });
      }
    }

    // Invalidate old OTPs
    await pool.execute(
      'UPDATE user_otps SET verified_at = NOW() WHERE user_id = ? AND verified_at IS NULL',
      [user.id]
    );

    // Generate new 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const otpId = uuidv4();
    await pool.execute(
      'INSERT INTO user_otps (id, user_id, otp_code, expires_at) VALUES (?, ?, ?, ?)',
      [otpId, user.id, otpCode, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(user.email, user.name, otpCode);

    res.json({ 
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify email (legacy - for password reset flows)
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
  moderatorLogin,
  adminLogin,
  refresh,
  logout,
  verifyOTP,
  resendOTP,
  verifyEmail,
  forgotPassword,
  resetPassword
};

