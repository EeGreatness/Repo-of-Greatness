import { Request, Response } from 'express';
import { pool, transaction } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { createPaymentIntent, confirmPaymentIntent } from '../services/stripeService';
import { sendEmail } from '../services/emailService';

// Get all orders for current user
export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { page = 1, limit = 10, status } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    SELECT o.*,
           json_agg(
             json_build_object(
               'id', oi.id,
               'product_id', oi.product_id,
               'product_name', oi.product_name,
               'product_sku', oi.product_sku,
               'price', oi.product_price,
               'quantity', oi.quantity,
               'subtotal', oi.subtotal
             )
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = $1
  `;

  const params: any[] = [req.user.userId];
  let paramCount = 1;

  if (status) {
    paramCount++;
    query += ` AND o.status = $${paramCount}`;
    params.push(status);
  }

  query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM orders WHERE user_id = $1' + (status ? ' AND status = $2' : ''),
    status ? [req.user.userId, status] : [req.user.userId]
  );

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

// Get single order by ID
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT o.*,
            json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'product_sku', oi.product_sku,
                'price', oi.product_price,
                'quantity', oi.quantity,
                'subtotal', oi.subtotal
              )
            ) as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1
     GROUP BY o.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = result.rows[0];

  // Check authorization - only order owner or admin can view
  if (req.user && req.user.userId !== order.user_id && req.user.role !== 'admin') {
    throw new AppError('You do not have permission to view this order', 403);
  }

  res.json({
    success: true,
    data: { order },
  });
};

// Create new order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const {
    items,
    shippingAddress,
    billingAddress,
    customerEmail,
    customerPhone,
    customerName,
    paymentMethodId,
    notes,
  } = req.body;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  if (!shippingAddress || !customerEmail || !customerName) {
    throw new AppError('Shipping address, email, and name are required', 400);
  }

  // Use transaction to ensure atomicity
  const result = await transaction(async (client) => {
    // Calculate order totals
    let subtotal = 0;
    const orderItems: any[] = [];

    // Validate products and calculate totals
    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, name, sku, price, stock_quantity FROM products WHERE id = $1 AND is_active = true',
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new AppError(`Product ${item.productId} not found or is inactive`, 400);
      }

      const product = productResult.rows[0];

      // Check stock
      if (product.stock_quantity < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`, 400);
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Calculate tax and shipping
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const shipping = subtotal > 0 ? 9.99 : 0;
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-10)}`;

    // Create Stripe payment intent
    let stripePaymentIntentId = null;
    if (paymentMethodId) {
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          orderNumber,
          customerEmail,
        },
      });

      stripePaymentIntentId = paymentIntent.id;
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_number, user_id, status, subtotal, tax, shipping, total,
        payment_status, payment_method, stripe_payment_intent_id,
        shipping_address, billing_address, customer_email, customer_phone, customer_name, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        orderNumber,
        req.user?.userId || null,
        'pending',
        subtotal,
        tax,
        shipping,
        total,
        paymentMethodId ? 'processing' : 'pending',
        paymentMethodId ? 'stripe' : null,
        stripePaymentIntentId,
        JSON.stringify(shippingAddress),
        billingAddress ? JSON.stringify(billingAddress) : JSON.stringify(shippingAddress),
        customerEmail,
        customerPhone,
        customerName,
        notes,
      ]
    );

    const order = orderResult.rows[0];

    // Create order items and update inventory
    for (const item of orderItems) {
      // Insert order item
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.productId, item.productName, item.productSku, item.productPrice, item.quantity, item.subtotal]
      );

      // Update product stock
      const stockResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE id = $2
         RETURNING stock_quantity, name`,
        [item.quantity, item.productId]
      );

      const updatedProduct = stockResult.rows[0];

      // Log inventory change
      await client.query(
        `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, reference_id, reference_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.productId,
          'sale',
          -item.quantity,
          updatedProduct.stock_quantity + item.quantity,
          updatedProduct.stock_quantity,
          `Order ${orderNumber}`,
          order.id,
          'order',
        ]
      );
    }

    // Clear user's cart if authenticated
    if (req.user) {
      await client.query('DELETE FROM shopping_carts WHERE user_id = $1', [req.user.userId]);
    }

    return { order, orderItems };
  });

  // Send order confirmation email (async, don't wait)
  sendEmail({
    to: customerEmail,
    subject: `Order Confirmation - ${result.order.order_number}`,
    template: 'order-confirmation',
    context: {
      customerName,
      orderNumber: result.order.order_number,
      orderDate: new Date(result.order.created_at).toLocaleDateString(),
      items: result.orderItems,
      total: result.order.total.toFixed(2),
      shippingAddress,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@techshop.com',
    },
  }).catch((err) => console.error('Error sending order confirmation email:', err));

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order: result.order,
      items: result.orderItems,
      paymentIntentId: result.order.stripe_payment_intent_id,
    },
  });
};

// Update order status (admin only)
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, trackingNumber, shippingCarrier, internalNotes } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  if (status && !validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  if (status) {
    paramCount++;
    updates.push(`status = $${paramCount}`);
    values.push(status);

    // Update timestamps based on status
    if (status === 'shipped') {
      paramCount++;
      updates.push(`shipped_at = $${paramCount}`);
      values.push(new Date());
    } else if (status === 'delivered') {
      paramCount++;
      updates.push(`delivered_at = $${paramCount}`);
      values.push(new Date());
    }
  }

  if (trackingNumber) {
    paramCount++;
    updates.push(`tracking_number = $${paramCount}`);
    values.push(trackingNumber);
  }

  if (shippingCarrier) {
    paramCount++;
    updates.push(`shipping_carrier = $${paramCount}`);
    values.push(shippingCarrier);
  }

  if (internalNotes) {
    paramCount++;
    updates.push(`internal_notes = $${paramCount}`);
    values.push(internalNotes);
  }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  paramCount++;
  values.push(id);

  const result = await pool.query(
    `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: { order: result.rows[0] },
  });
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await transaction(async (client) => {
    // Get order
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order = orderResult.rows[0];

    // Check authorization
    if (req.user && req.user.userId !== order.user_id && req.user.role !== 'admin') {
      throw new AppError('You do not have permission to cancel this order', 403);
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
      throw new AppError(`Cannot cancel order with status: ${order.status}`, 400);
    }

    // Update order status
    const updateResult = await client.query(
      `UPDATE orders SET status = 'cancelled', internal_notes = $1 WHERE id = $2 RETURNING *`,
      [reason || 'Cancelled by customer', id]
    );

    // Get order items
    const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);

    // Restore inventory
    for (const item of itemsResult.rows) {
      const stockResult = await client.query(
        `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING stock_quantity`,
        [item.quantity, item.product_id]
      );

      if (stockResult.rows.length > 0) {
        const updatedStock = stockResult.rows[0];

        // Log inventory change
        await client.query(
          `INSERT INTO inventory_logs (product_id, change_type, quantity_change, previous_quantity, new_quantity, reason, reference_id, reference_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.product_id,
            'return',
            item.quantity,
            updatedStock.stock_quantity - item.quantity,
            updatedStock.stock_quantity,
            `Order ${order.order_number} cancelled`,
            order.id,
            'order',
          ]
        );
      }
    }

    // Process refund if payment was made
    if (order.stripe_payment_intent_id && order.payment_status === 'succeeded') {
      // This would trigger refund via Stripe
      // const refund = await createRefund(order.stripe_payment_intent_id);
      await client.query(
        `UPDATE orders SET payment_status = 'refunded' WHERE id = $1`,
        [id]
      );
    }

    return updateResult.rows[0];
  });

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order: result },
  });
};

// Get order statistics (admin only)
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;

  let dateFilter = '';
  const params: any[] = [];

  if (startDate && endDate) {
    dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
    params.push(startDate, endDate);
  }

  const stats = await pool.query(
    `SELECT
       COUNT(*) as total_orders,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
       SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
       SUM(total) as total_revenue,
       AVG(total) as average_order_value
     FROM orders ${dateFilter}`,
    params
  );

  res.json({
    success: true,
    data: { stats: stats.rows[0] },
  });
};
