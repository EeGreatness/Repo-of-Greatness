import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, isAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { productLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/', productLimiter, asyncHandler(getProducts)); // List all products
router.get('/:id', productLimiter, asyncHandler(getProduct)); // Get single product

// Admin only routes
router.post('/', authenticate, isAdmin, asyncHandler(createProduct)); // Create product
router.put('/:id', authenticate, isAdmin, asyncHandler(updateProduct)); // Update product
router.delete('/:id', authenticate, isAdmin, asyncHandler(deleteProduct)); // Delete product

export default router;
