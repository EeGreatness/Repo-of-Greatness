import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { sendEmail } from '../services/emailService';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, phone } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Generate email verification token
  const emailVerificationToken = uuidv4();

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, email_verification_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name, role, created_at`,
    [email.toLowerCase(), passwordHash, firstName, lastName, phone, emailVerificationToken]
  );

  const user = result.rows[0];

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address)
     VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
    [user.id, tokens.refreshToken, req.ip]
  );

  // Send verification email (async, don't wait)
  sendEmail({
    to: user.email,
    subject: 'Verify your email - TechShop',
    template: 'email-verification',
    context: {
      name: user.first_name || 'User',
      verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`,
    },
  }).catch(err => console.error('Error sending verification email:', err));

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      tokens,
    },
  });
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const result = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, role, is_active, email_verified
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if account is active
  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, device_info)
     VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
    [user.id, tokens.refreshToken, req.ip, JSON.stringify({ userAgent: req.headers['user-agent'] })]
  );

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: user.email_verified,
      },
      tokens,
    },
  });
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // Verify refresh token
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Check if token exists in database
  const sessionResult = await pool.query(
    `SELECT s.user_id, u.email, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.refresh_token = $1 AND s.expires_at > NOW() AND u.is_active = true`,
    [refreshToken]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = sessionResult.rows[0];

  // Generate new access token
  const tokens = generateTokenPair({
    userId: user.user_id,
    email: user.email,
    role: user.role,
  });

  // Update refresh token in database
  await pool.query(
    `UPDATE sessions
     SET refresh_token = $1, expires_at = NOW() + INTERVAL '7 days'
     WHERE refresh_token = $2`,
    [tokens.refreshToken, refreshToken]
  );

  res.json({
    success: true,
    data: { tokens },
  });
};

// Logout user
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Delete session from database
    await pool.query('DELETE FROM sessions WHERE refresh_token = $1', [refreshToken]);
  }

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const result = await pool.query(
    `SELECT id, email, first_name, last_name, phone, role, email_verified, created_at, last_login
     FROM users WHERE id = $1`,
    [req.user.userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    },
  });
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  const result = await pool.query(
    `UPDATE users
     SET email_verified = true, email_verification_token = NULL
     WHERE email_verification_token = $1
     RETURNING id, email`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
};

// Request password reset
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const result = await pool.query(
    'SELECT id, email, first_name FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  // Always return success even if email doesn't exist (security)
  if (result.rows.length === 0) {
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
    return;
  }

  const user = result.rows[0];

  // Generate reset token
  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  // Store reset token
  await pool.query(
    `UPDATE users
     SET password_reset_token = $1, password_reset_expires = $2
     WHERE id = $3`,
    [resetToken, resetExpires, user.id]
  );

  // Send password reset email
  await sendEmail({
    to: user.email,
    subject: 'Reset your password - TechShop',
    template: 'password-reset',
    context: {
      name: user.first_name || 'User',
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    },
  });

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Find user with valid reset token
  const result = await pool.query(
    `SELECT id FROM users
     WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const userId = result.rows[0].id;

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and clear reset token
  await pool.query(
    `UPDATE users
     SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
     WHERE id = $2`,
    [passwordHash, userId]
  );

  // Invalidate all sessions for this user
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

  res.json({
    success: true,
    message: 'Password reset successfully. Please login with your new password.',
  });
};
