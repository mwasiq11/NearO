import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendOTPEmail } from '../services/emailService.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import crypto from 'crypto';
import { verifyGoogleToken } from '../utils/googleAuth.js';

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
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (not verified yet)
    await prisma.users.create({
      data: {
        id,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'user',
        is_verified: false
      }
    });

    // Generate 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    await prisma.user_otps.create({
      data: {
        id: uuidv4(),
        user_id: id,
        otp_code: otpCode,
        expires_at: expiresAt
      }
    });

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
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Allow all roles to log in via this consolidated endpoint

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
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // Check if password change is required
    if (user.must_change_password) {
      const limitedTokens = {
        accessToken: generateAccessToken({
          id: user.id,
          email: user.email,
          role: user.role,
          scope: 'PASSWORD_CHANGE_ONLY'
        }),
        refreshToken: null, // No refresh token for limited sessions
        expiresIn: '15m'
      };

      return res.status(200).json({
        status: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before accessing the application',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          must_change_password: true
        },
        ...limitedTokens
      });
    }

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
    await prisma.user_sessions.create({
      data: {
        id: sessionId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

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
    const user = await prisma.users.findFirst({
      where: { email, role: 'moderator' }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

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
    await prisma.user_sessions.create({
      data: {
        id: sessionId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

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
    const user = await prisma.users.findFirst({
      where: { email, role: 'admin' }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

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
    await prisma.user_sessions.create({
      data: {
        id: sessionId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

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
    const sessions = await prisma.user_sessions.findMany({
      where: {
        user_id: decoded.id,
        expires_at: { gt: new Date() }
      }
    });

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
    const user = await prisma.users.findFirst({
      where: {
        id: decoded.id,
        is_active: true
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

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
      const sessions = await prisma.user_sessions.findMany({
        where: { expires_at: { gt: new Date() } }
      });

      for (const session of sessions) {
        if (await bcrypt.compare(refreshToken, session.token_hash)) {
          await prisma.user_sessions.delete({
            where: { id: session.id }
          });
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
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, is_verified: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    // Find valid OTP
    const otpRecord = await prisma.user_otps.findFirst({
      where: {
        user_id: user.id,
        otp_code: normalizedOtp,
        expires_at: { gt: new Date() },
        verified_at: null
      },
      orderBy: { created_at: 'desc' }
    });

    if (!otpRecord) {
      // Increment attempts
      await prisma.user_otps.updateMany({
        where: { user_id: user.id, verified_at: null },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if too many attempts (security measure)
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    // Mark user as verified
    await prisma.users.update({
      where: { id: user.id },
      data: { is_verified: true, email_verified_at: new Date() }
    });

    // Mark OTP as used
    await prisma.user_otps.update({
      where: { id: otpRecord.id },
      data: { verified_at: new Date() }
    });

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
    await prisma.user_sessions.create({
      data: {
        id: sessionId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

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
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, is_verified: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email already verified. Please login.' });
    }

    // Check for recent OTP (rate limiting)
    const lastOtp = await prisma.user_otps.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true }
    });

    if (lastOtp) {
      const lastOtpTime = new Date(lastOtp.created_at);
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
    await prisma.user_otps.updateMany({
      where: { user_id: user.id, verified_at: null },
      data: { verified_at: new Date() }
    });

    // Generate new 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    await prisma.user_otps.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        otp_code: otpCode,
        expires_at: expiresAt
      }
    });

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
    const verification = await prisma.email_verifications.findFirst({
      where: {
        token,
        expires_at: { gt: new Date() },
        verified_at: null
      }
    });

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Update user as verified
    await prisma.users.update({
      where: { id: verification.user_id },
      data: { is_verified: true, email_verified_at: new Date() }
    });

    // Mark verification as used
    await prisma.email_verifications.update({
      where: { id: verification.id },
      data: { verified_at: new Date() }
    });

    // Get user and send welcome email
    const user = await prisma.users.findUnique({
      where: { id: verification.user_id },
      select: { name: true, email: true }
    });
    if (user) {
      await sendWelcomeEmail(user.email, user.name);
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
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });

    // Don't reveal if email exists or not (security best practice)
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry

      await prisma.password_resets.create({
        data: {
          id: uuidv4(),
          user_id: user.id,
          token: hashedToken,
          expires_at: expiresAt
        }
      });

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

    // Hash the incoming token for comparison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find reset record
    const reset = await prisma.password_resets.findFirst({
      where: {
        token: hashedToken,
        expires_at: { gt: new Date() },
        used_at: null
      }
    });

    if (!reset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.users.update({
      where: { id: reset.user_id },
      data: { password: hashedPassword }
    });

    // Mark reset token as used
    await prisma.password_resets.update({
      where: { id: reset.id },
      data: { used_at: new Date() }
    });

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Change password (for forced password change on first login)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isMatched) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user: set new password and clear must_change_password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        must_change_password: false
      }
    });

    // Log the change
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: userId,
      actionType: 'password_change_forced',
      entityType: 'user',
      entityId: userId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Google Authentication (Login/Signup)
 */
const googleAuth = async (req, res) => {
  try {
    // 1. Redirect mode uses 'credential' in req.body, not 'token'
    const { credential } = req.body;

    if (!credential) {
      // In redirect mode, if we error, we should redirect back to login with an error param
      return res.redirect('https://nearo-six.vercel.app/login?error=no_credential');
    }

    // 2. Verify token with Google (Ensure verifyGoogleToken accepts the credential string)
    const googleUser = await verifyGoogleToken(credential);
    const { email, name, picture, googleId } = googleUser;
    const normalizedEmail = email.toLowerCase();

    // 3. Check if user exists
    let user = await prisma.users.findUnique({
      where: { email: normalizedEmail }
    });

    if (user) {
      if (!user.google_id || user.auth_provider === 'local') {
        user = await prisma.users.update({
          where: { id: user.id },
          data: { 
            google_id: googleId,
            auth_provider: 'google',
            profile_picture: user.profile_picture || picture,
            is_verified: true,
            email_verified_at: user.email_verified_at || new Date()
          }
        });
      }
    } else {
      const id = uuidv4();
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.users.create({
        data: {
          id,
          name,
          email: normalizedEmail,
          password: hashedPassword,
          google_id: googleId,
          auth_provider: 'google',
          profile_picture: picture,
          role: 'user',
          is_verified: true,
          email_verified_at: new Date()
        }
      });

      try {
        await sendWelcomeEmail(normalizedEmail, name);
      } catch (emailError) {
        console.warn('Welcome email failed:', emailError);
      }
    }

    if (!user.is_active) {
      return res.redirect('https://nearo-six.vercel.app/login?error=suspended');
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    // 4. Generate JWT tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // 5. Session Management (Store refresh token)
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.user_sessions.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

    // 6. Audit Trail
    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: user.id,
      actionType: 'user_login_google',
      entityType: 'user',
      entityId: user.id,
      metadata: { name: user.name, email: user.email, role: user.role },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    // 7. FINAL STEP: Redirect back to the frontend
    // We pass the accessToken in the URL so the frontend can capture it and log the user in.
    // For production, you might prefer setting a Secure HTTP-Only Cookie.
    const redirectUrl = `https://nearo-six.vercel.app/login?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.redirect('https://nearo-six.vercel.app/login?error=auth_failed');
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
  resetPassword,
  googleAuth,
  changePassword
};
