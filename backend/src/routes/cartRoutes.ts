import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
  validateCart,
} from '../controllers/cartController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { cartLimiter } from '../middleware/rateLimiter';

const router = Router();

// All cart routes support both authenticated and guest users
router.get('/', optionalAuthenticate, asyncHandler(getCart)); // Get cart
router.post('/items', optionalAuthenticate, cartLimiter, asyncHandler(addToCart)); // Add item to cart
router.put('/items/:productId', optionalAuthenticate, cartLimiter, asyncHandler(updateCartItem)); // Update item quantity
router.delete('/items/:productId', optionalAuthenticate, asyncHandler(removeFromCart)); // Remove item from cart
router.delete('/', optionalAuthenticate, asyncHandler(clearCart)); // Clear cart
router.post('/validate', optionalAuthenticate, asyncHandler(validateCart)); // Validate cart before checkout

// Authenticated only
router.post('/sync', authenticate, asyncHandler(syncCart)); // Sync guest cart with user cart (on login)

export default router;
