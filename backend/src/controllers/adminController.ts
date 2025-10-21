import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  let dateFilter = '';
  const params: any[] = [];

  if (startDate && endDate) {
    dateFilter = 'AND created_at BETWEEN $1 AND $2';
    params.push(startDate, endDate);
  }

  // Get overall statistics
  const [orderStats, userStats, productStats, revenueStats] = await Promise.all([
    // Order statistics
    pool.query(
      `SELECT
         COUNT(*) as total_orders,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
         SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
         SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_orders,
         AVG(total) as average_order_value
       FROM orders
       WHERE 1=1 ${dateFilter}`,
      params
    ),

    // User statistics
    pool.query(
      `SELECT
         COUNT(*) as total_users,
         SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customers,
         SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
         SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff,
         SUM(CASE WHEN email_verified = true THEN 1 ELSE 0 END) as verified_users,
         SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users
       FROM users`
    ),

    // Product statistics
    pool.query(
      `SELECT
         COUNT(*) as total_products,
         SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_products,
         SUM(CASE WHEN is_featured = true THEN 1 ELSE 0 END) as featured_products,
         SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
         SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
         SUM(stock_quantity) as total_inventory_items
       FROM products`
    ),

    // Revenue statistics
    pool.query(
      `SELECT
         SUM(total) as total_revenue,
         SUM(subtotal) as subtotal_revenue,
         SUM(tax) as total_tax,
         SUM(shipping) as total_shipping,
         COUNT(DISTINCT user_id) as unique_customers
       FROM orders
       WHERE payment_status = 'succeeded' ${dateFilter}`,
      params
    ),
  ]);

  // Get recent orders
  const recentOrders = await pool.query(
    `SELECT id, order_number, customer_name, total, status, created_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT 10`
  );

  // Get top selling products
  const topProducts = await pool.query(
    `SELECT p.id, p.name, p.slug, SUM(oi.quantity) as units_sold, SUM(oi.subtotal) as revenue
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.payment_status = 'succeeded' ${dateFilter}
     GROUP BY p.id, p.name, p.slug
     ORDER BY units_sold DESC
     LIMIT 10`,
    params
  );

  // Get revenue by day (last 30 days)
  const revenueByDay = await pool.query(
    `SELECT
       DATE(created_at) as date,
       COUNT(*) as orders,
       SUM(total) as revenue
     FROM orders
     WHERE payment_status = 'succeeded'
       AND created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`
  );

  res.json({
    success: true,
    data: {
      orders: orderStats.rows[0],
      users: userStats.rows[0],
      products: productStats.rows[0],
      revenue: revenueStats.rows[0],
      recentOrders: recentOrders.rows,
      topProducts: topProducts.rows,
      revenueByDay: revenueByDay.rows,
    },
  });
};

// Get all users with filters
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    emailVerified,
    search,
    sortBy = 'created_at',
    order = 'DESC',
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = 'SELECT id, email, first_name, last_name, phone, role, email_verified, is_active, created_at, last_login FROM users WHERE 1=1';
  const params: any[] = [];
  let paramCount = 0;

  // Add filters
  if (role) {
    paramCount++;
    query += ` AND role = $${paramCount}`;
    params.push(role);
  }

  if (isActive !== undefined) {
    paramCount++;
    query += ` AND is_active = $${paramCount}`;
    params.push(isActive === 'true');
  }

  if (emailVerified !== undefined) {
    paramCount++;
    query += ` AND email_verified = $${paramCount}`;
    params.push(emailVerified === 'true');
  }

  if (search) {
    paramCount++;
    query += ` AND (email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  // Add sorting
  const validSortFields = ['created_at', 'email', 'last_login', 'first_name'];
  const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  query += ` ORDER BY ${sortField} ${sortOrder}`;

  // Add pagination
  paramCount++;
  query += ` LIMIT $${paramCount}`;
  params.push(limit);

  paramCount++;
  query += ` OFFSET $${paramCount}`;
  params.push(offset);

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
  const countParams: any[] = [];
  let countParamIndex = 0;

  if (role) {
    countParamIndex++;
    countQuery += ` AND role = $${countParamIndex}`;
    countParams.push(role);
  }

  if (isActive !== undefined) {
    countParamIndex++;
    countQuery += ` AND is_active = $${countParamIndex}`;
    countParams.push(isActive === 'true');
  }

  if (emailVerified !== undefined) {
    countParamIndex++;
    countQuery += ` AND email_verified = $${countParamIndex}`;
    countParams.push(emailVerified === 'true');
  }

  const countResult = await pool.query(countQuery, countParams);

  res.json({
    success: true,
    data: {
      users: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit)),
      },
    },
  });
};

// Get single user details
export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const userResult = await pool.query(
    `SELECT id, email, first_name, last_name, phone, role, email_verified, is_active, created_at, last_login
     FROM users WHERE id = $1`,
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Get user's order statistics
  const orderStats = await pool.query(
    `SELECT
       COUNT(*) as total_orders,
       SUM(total) as total_spent,
       AVG(total) as average_order_value,
       MAX(created_at) as last_order_date
     FROM orders WHERE user_id = $1 AND payment_status = 'succeeded'`,
    [id]
  );

  // Get recent orders
  const recentOrders = await pool.query(
    `SELECT id, order_number, total, status, created_at
     FROM orders WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 5`,
    [id]
  );

  res.json({
    success: true,
    data: {
      user: userResult.rows[0],
      statistics: orderStats.rows[0],
      recentOrders: recentOrders.rows,
    },
  });
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { firstName, lastName, phone, role, isActive, emailVerified } = req.body;

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  if (firstName !== undefined) {
    paramCount++;
    updates.push(`first_name = $${paramCount}`);
    values.push(firstName);
  }

  if (lastName !== undefined) {
    paramCount++;
    updates.push(`last_name = $${paramCount}`);
    values.push(lastName);
  }

  if (phone !== undefined) {
    paramCount++;
    updates.push(`phone = $${paramCount}`);
    values.push(phone);
  }

  if (role !== undefined) {
    const validRoles = ['customer', 'staff', 'admin'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    paramCount++;
    updates.push(`role = $${paramCount}`);
    values.push(role);
  }

  if (isActive !== undefined) {
    paramCount++;
    updates.push(`is_active = $${paramCount}`);
    values.push(isActive);
  }

  if (emailVerified !== undefined) {
    paramCount++;
    updates.push(`email_verified = $${paramCount}`);
    values.push(emailVerified);
  }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  paramCount++;
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, role, is_active, email_verified`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: result.rows[0] },
  });
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Prevent deactivating yourself
  if (req.user && req.user.userId === id) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  const result = await pool.query(
    'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, email',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  // Invalidate all user sessions
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
};

// Get all orders with advanced filters (admin)
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT o.*, u.email as user_email, u.first_name, u.last_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    query += ` AND o.status = $${paramCount}`;
    params.push(status);
  }

  if (paymentStatus) {
    paramCount++;
    query += ` AND o.payment_status = $${paramCount}`;
    params.push(paymentStatus);
  }

  if (startDate) {
    paramCount++;
    query += ` AND o.created_at >= $${paramCount}`;
    params.push(startDate);
  }

  if (endDate) {
    paramCount++;
    query += ` AND o.created_at <= $${paramCount}`;
    params.push(endDate);
  }

  if (minAmount) {
    paramCount++;
    query += ` AND o.total >= $${paramCount}`;
    params.push(minAmount);
  }

  if (maxAmount) {
    paramCount++;
    query += ` AND o.total <= $${paramCount}`;
    params.push(maxAmount);
  }

  if (search) {
    paramCount++;
    query += ` AND (o.order_number ILIKE $${paramCount} OR o.customer_email ILIKE $${paramCount} OR o.customer_name ILIKE $${paramCount})`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM orders o WHERE 1=1';
  const countParams: any[] = [];
  let countIndex = 0;

  if (status) {
    countIndex++;
    countQuery += ` AND o.status = $${countIndex}`;
    countParams.push(status);
  }

  if (paymentStatus) {
    countIndex++;
    countQuery += ` AND o.payment_status = $${countIndex}`;
    countParams.push(paymentStatus);
  }

  const countResult = await pool.query(countQuery, countParams);

  res.json({
    success: true,
    data: {
      orders: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit)),
      },
    },
  });
};

// Get inventory report
export const getInventoryReport = async (req: Request, res: Response): Promise<void> => {
  const { status = 'all' } = req.query;

  let query = `
    SELECT p.*, c.name as category_name,
           CASE
             WHEN p.stock_quantity = 0 THEN 'out_of_stock'
             WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
             ELSE 'in_stock'
           END as stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
  `;

  if (status === 'low') {
    query += ' AND p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold';
  } else if (status === 'out') {
    query += ' AND p.stock_quantity = 0';
  }

  query += ' ORDER BY p.stock_quantity ASC, p.name ASC';

  const result = await pool.query(query);

  // Get summary
  const summary = await pool.query(`
    SELECT
      COUNT(*) as total_products,
      SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN stock_quantity > low_stock_threshold THEN 1 ELSE 0 END) as in_stock,
      SUM(stock_quantity) as total_items
    FROM products WHERE is_active = true
  `);

  res.json({
    success: true,
    data: {
      products: result.rows,
      summary: summary.rows[0],
    },
  });
};

// Get sales analytics
export const getSalesAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { period = '30days' } = req.query;

  let interval = '30 days';
  let groupBy = "DATE(created_at)";

  if (period === '7days') {
    interval = '7 days';
  } else if (period === '90days') {
    interval = '90 days';
  } else if (period === '1year') {
    interval = '1 year';
    groupBy = "DATE_TRUNC('month', created_at)";
  }

  // Revenue over time
  const revenueOverTime = await pool.query(
    `SELECT
       ${groupBy} as date,
       COUNT(*) as orders,
       SUM(total) as revenue,
       AVG(total) as average_order_value
     FROM orders
     WHERE payment_status = 'succeeded'
       AND created_at >= NOW() - INTERVAL '${interval}'
     GROUP BY ${groupBy}
     ORDER BY date ASC`
  );

  // Sales by category
  const salesByCategory = await pool.query(
    `SELECT
       c.name as category,
       COUNT(DISTINCT o.id) as orders,
       SUM(oi.quantity) as units_sold,
       SUM(oi.subtotal) as revenue
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN categories c ON p.category_id = c.id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.payment_status = 'succeeded'
       AND o.created_at >= NOW() - INTERVAL '${interval}'
     GROUP BY c.name
     ORDER BY revenue DESC`
  );

  // Top customers
  const topCustomers = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.first_name,
       u.last_name,
       COUNT(o.id) as order_count,
       SUM(o.total) as total_spent
     FROM users u
     JOIN orders o ON u.id = o.user_id
     WHERE o.payment_status = 'succeeded'
       AND o.created_at >= NOW() - INTERVAL '${interval}'
     GROUP BY u.id, u.email, u.first_name, u.last_name
     ORDER BY total_spent DESC
     LIMIT 10`
  );

  res.json({
    success: true,
    data: {
      revenueOverTime: revenueOverTime.rows,
      salesByCategory: salesByCategory.rows,
      topCustomers: topCustomers.rows,
    },
  });
};

// Get inventory logs
export const getInventoryLogs = async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 50, productId, changeType } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT il.*, p.name as product_name, u.email as created_by_email
    FROM inventory_logs il
    LEFT JOIN products p ON il.product_id = p.id
    LEFT JOIN users u ON il.created_by = u.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramCount = 0;

  if (productId) {
    paramCount++;
    query += ` AND il.product_id = $${paramCount}`;
    params.push(productId);
  }

  if (changeType) {
    paramCount++;
    query += ` AND il.change_type = $${paramCount}`;
    params.push(changeType);
  }

  query += ` ORDER BY il.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      logs: result.rows,
    },
  });
};

// Bulk update product status
export const bulkUpdateProducts = async (req: Request, res: Response): Promise<void> => {
  const { productIds, isActive, isFeatured } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new AppError('Product IDs array is required', 400);
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  if (isActive !== undefined) {
    paramCount++;
    updates.push(`is_active = $${paramCount}`);
    values.push(isActive);
  }

  if (isFeatured !== undefined) {
    paramCount++;
    updates.push(`is_featured = $${paramCount}`);
    values.push(isFeatured);
  }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  paramCount++;
  values.push(productIds);

  const result = await pool.query(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ANY($${paramCount}::uuid[]) RETURNING id`,
    values
  );

  res.json({
    success: true,
    message: `${result.rowCount} products updated successfully`,
  });
};
