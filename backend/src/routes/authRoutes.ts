import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refreshToken));
router.post('/logout', asyncHandler(logout));
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/forgot-password', authLimiter, asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

// Protected routes
router.get('/me', authenticate, asyncHandler(getCurrentUser));

export default router;
