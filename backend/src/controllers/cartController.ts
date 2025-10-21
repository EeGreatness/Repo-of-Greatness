import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface CartItem {
  productId: string;
  quantity: number;
}

// Get cart identifier (user ID or session ID)
const getCartIdentifier = (req: Request): { userId?: string; sessionId?: string } => {
  if (req.user) {
    return { userId: req.user.userId };
  }

  // Get or create session ID from cookies
  let sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
  }

  return { sessionId };
};

// Get current cart
export const getCart = async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId } = getCartIdentifier(req);

  let query = 'SELECT * FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  const result = await pool.query(query, params);

  let cart = result.rows[0];
  let items = [];

  if (cart) {
    // Get product details for cart items
    const cartItems = cart.items || [];

    if (cartItems.length > 0) {
      const productIds = cartItems.map((item: CartItem) => item.productId);

      const productsResult = await pool.query(
        `SELECT id, name, slug, price, stock_quantity, images, is_active
         FROM products
         WHERE id = ANY($1::uuid[])`,
        [productIds]
      );

      const productsMap = new Map(productsResult.rows.map((p) => [p.id, p]));

      items = cartItems
        .map((item: CartItem) => {
          const product = productsMap.get(item.productId);
          if (!product || !product.is_active) return null;

          return {
            productId: item.productId,
            name: product.name,
            slug: product.slug,
            price: parseFloat(product.price),
            quantity: item.quantity,
            subtotal: parseFloat(product.price) * item.quantity,
            stockAvailable: product.stock_quantity,
            images: product.images,
          };
        })
        .filter(Boolean); // Remove null items (inactive products)
    }
  }

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 0 ? 9.99 : 0;
  const total = subtotal + tax + shipping;

  // Set session cookie if guest
  if (!userId && sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  res.json({
    success: true,
    data: {
      cart: {
        items,
        itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        subtotal,
        tax,
        shipping,
        total,
      },
    },
  });
};

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  // Verify product exists and is active
  const productResult = await pool.query(
    'SELECT id, name, stock_quantity, is_active FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError('Product not found', 404);
  }

  const product = productResult.rows[0];

  if (!product.is_active) {
    throw new AppError('Product is not available', 400);
  }

  if (product.stock_quantity < quantity) {
    throw new AppError(`Only ${product.stock_quantity} items available in stock`, 400);
  }

  const { userId, sessionId } = getCartIdentifier(req);

  // Get existing cart
  let query = 'SELECT * FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  const cartResult = await pool.query(query, params);

  let cart = cartResult.rows[0];
  let items: CartItem[] = cart?.items || [];

  // Check if product already in cart
  const existingItemIndex = items.findIndex((item: CartItem) => item.productId === productId);

  if (existingItemIndex >= 0) {
    // Update quantity
    items[existingItemIndex].quantity += quantity;

    // Check stock again
    if (items[existingItemIndex].quantity > product.stock_quantity) {
      throw new AppError(`Cannot add more than ${product.stock_quantity} items`, 400);
    }
  } else {
    // Add new item
    items.push({ productId, quantity });
  }

  // Update or create cart
  if (cart) {
    await pool.query(
      'UPDATE shopping_carts SET items = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(items), cart.id]
    );
  } else {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await pool.query(
      `INSERT INTO shopping_carts (user_id, session_id, items, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, sessionId || null, JSON.stringify(items), expiresAt]
    );
  }

  // Set session cookie if guest
  if (!userId && sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  res.json({
    success: true,
    message: `${product.name} added to cart`,
  });
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (quantity < 0) {
    throw new AppError('Quantity cannot be negative', 400);
  }

  // Verify product
  const productResult = await pool.query(
    'SELECT id, name, stock_quantity FROM products WHERE id = $1',
    [productId]
  );

  if (productResult.rows.length === 0) {
    throw new AppError('Product not found', 404);
  }

  const product = productResult.rows[0];

  if (quantity > product.stock_quantity) {
    throw new AppError(`Only ${product.stock_quantity} items available in stock`, 400);
  }

  const { userId, sessionId } = getCartIdentifier(req);

  // Get cart
  let query = 'SELECT * FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  const cartResult = await pool.query(query, params);

  if (cartResult.rows.length === 0) {
    throw new AppError('Cart not found', 404);
  }

  const cart = cartResult.rows[0];
  let items: CartItem[] = cart.items || [];

  // Find and update item
  const itemIndex = items.findIndex((item: CartItem) => item.productId === productId);

  if (itemIndex < 0) {
    throw new AppError('Item not found in cart', 404);
  }

  if (quantity === 0) {
    // Remove item
    items.splice(itemIndex, 1);
  } else {
    // Update quantity
    items[itemIndex].quantity = quantity;
  }

  // Update cart
  await pool.query(
    'UPDATE shopping_carts SET items = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(items), cart.id]
  );

  res.json({
    success: true,
    message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
  });
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;

  const { userId, sessionId } = getCartIdentifier(req);

  // Get cart
  let query = 'SELECT * FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  const cartResult = await pool.query(query, params);

  if (cartResult.rows.length === 0) {
    throw new AppError('Cart not found', 404);
  }

  const cart = cartResult.rows[0];
  let items: CartItem[] = cart.items || [];

  // Remove item
  items = items.filter((item: CartItem) => item.productId !== productId);

  // Update cart
  await pool.query(
    'UPDATE shopping_carts SET items = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(items), cart.id]
  );

  res.json({
    success: true,
    message: 'Item removed from cart',
  });
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId } = getCartIdentifier(req);

  let query = 'DELETE FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  await pool.query(query, params);

  res.json({
    success: true,
    message: 'Cart cleared successfully',
  });
};

// Sync guest cart with user cart (on login)
export const syncCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    throw new AppError('Session ID required', 400);
  }

  // Get guest cart
  const guestCartResult = await pool.query(
    'SELECT * FROM shopping_carts WHERE session_id = $1',
    [sessionId]
  );

  if (guestCartResult.rows.length === 0) {
    res.json({
      success: true,
      message: 'No guest cart to sync',
    });
    return;
  }

  const guestCart = guestCartResult.rows[0];
  const guestItems: CartItem[] = guestCart.items || [];

  // Get user cart
  const userCartResult = await pool.query(
    'SELECT * FROM shopping_carts WHERE user_id = $1',
    [req.user.userId]
  );

  if (userCartResult.rows.length === 0) {
    // No user cart exists, transfer guest cart to user
    await pool.query(
      'UPDATE shopping_carts SET user_id = $1, session_id = NULL WHERE session_id = $2',
      [req.user.userId, sessionId]
    );
  } else {
    // Merge carts
    const userCart = userCartResult.rows[0];
    let userItems: CartItem[] = userCart.items || [];

    // Merge items
    for (const guestItem of guestItems) {
      const existingIndex = userItems.findIndex(
        (item: CartItem) => item.productId === guestItem.productId
      );

      if (existingIndex >= 0) {
        // Increase quantity
        userItems[existingIndex].quantity += guestItem.quantity;
      } else {
        // Add new item
        userItems.push(guestItem);
      }
    }

    // Update user cart
    await pool.query(
      'UPDATE shopping_carts SET items = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(userItems), userCart.id]
    );

    // Delete guest cart
    await pool.query('DELETE FROM shopping_carts WHERE session_id = $1', [sessionId]);
  }

  res.json({
    success: true,
    message: 'Cart synced successfully',
  });
};

// Validate cart (check stock and prices before checkout)
export const validateCart = async (req: Request, res: Response): Promise<void> => {
  const { userId, sessionId } = getCartIdentifier(req);

  let query = 'SELECT * FROM shopping_carts WHERE ';
  const params: any[] = [];

  if (userId) {
    query += 'user_id = $1';
    params.push(userId);
  } else {
    query += 'session_id = $1';
    params.push(sessionId);
  }

  const cartResult = await pool.query(query, params);

  if (cartResult.rows.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  const cart = cartResult.rows[0];
  const items: CartItem[] = cart.items || [];

  if (items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Validate each item
  const issues: any[] = [];
  const productIds = items.map((item: CartItem) => item.productId);

  const productsResult = await pool.query(
    `SELECT id, name, price, stock_quantity, is_active
     FROM products
     WHERE id = ANY($1::uuid[])`,
    [productIds]
  );

  const productsMap = new Map(productsResult.rows.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productsMap.get(item.productId);

    if (!product) {
      issues.push({
        productId: item.productId,
        issue: 'Product no longer exists',
      });
      continue;
    }

    if (!product.is_active) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: 'Product is no longer available',
      });
      continue;
    }

    if (product.stock_quantity < item.quantity) {
      issues.push({
        productId: item.productId,
        productName: product.name,
        issue: `Insufficient stock. Only ${product.stock_quantity} available`,
        requestedQuantity: item.quantity,
        availableQuantity: product.stock_quantity,
      });
    }
  }

  if (issues.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Cart validation failed',
      issues,
    });
    return;
  }

  res.json({
    success: true,
    message: 'Cart is valid and ready for checkout',
  });
};
