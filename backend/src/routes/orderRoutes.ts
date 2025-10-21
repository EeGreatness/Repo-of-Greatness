import { Router } from 'express';
import {
  getUserOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from '../controllers/orderController';
import { authenticate, optionalAuthenticate, isAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { apiLimiter, paymentLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public/optional auth routes
router.post('/', optionalAuthenticate, paymentLimiter, asyncHandler(createOrder)); // Create order (guest or authenticated)

// Protected routes (require authentication)
router.get('/', authenticate, asyncHandler(getUserOrders)); // Get user's orders
router.get('/:id', authenticate, asyncHandler(getOrder)); // Get single order
router.put('/:id/cancel', authenticate, apiLimiter, asyncHandler(cancelOrder)); // Cancel order

// Admin only routes
router.put('/:id/status', authenticate, isAdmin, asyncHandler(updateOrderStatus)); // Update order status
router.get('/admin/stats', authenticate, isAdmin, asyncHandler(getOrderStats)); // Get order statistics

export default router;
