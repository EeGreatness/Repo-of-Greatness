import { Router } from 'express';
import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  getAllOrders,
  getInventoryReport,
  getSalesAnalytics,
  getInventoryLogs,
  bulkUpdateProducts,
} from '../controllers/adminController';
import { authenticate, isAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', asyncHandler(getDashboardStats)); // Get dashboard statistics

// User Management
router.get('/users', asyncHandler(getUsers)); // List all users with filters
router.get('/users/:id', asyncHandler(getUser)); // Get user details
router.put('/users/:id', asyncHandler(updateUser)); // Update user
router.put('/users/:id/deactivate', asyncHandler(deactivateUser)); // Deactivate user

// Order Management
router.get('/orders', asyncHandler(getAllOrders)); // List all orders with advanced filters

// Inventory Management
router.get('/inventory', asyncHandler(getInventoryReport)); // Get inventory report
router.get('/inventory/logs', asyncHandler(getInventoryLogs)); // Get inventory logs
router.put('/products/bulk', asyncHandler(bulkUpdateProducts)); // Bulk update products

// Analytics & Reports
router.get('/analytics/sales', asyncHandler(getSalesAnalytics)); // Get sales analytics

export default router;
