import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { cacheHelpers } from '../config/redis';

// Get all products with filtering, pagination, and search
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 20,
    category,
    search,
    minPrice,
    maxPrice,
    sortBy = 'created_at',
    order = 'DESC',
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  // Build query
  let queryText = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
  `;

  const queryParams: any[] = [];
  let paramCount = 0;

  // Add filters
  if (category) {
    paramCount++;
    queryText += ` AND c.slug = $${paramCount}`;
    queryParams.push(category);
  }

  if (search) {
    paramCount++;
    queryText += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
    queryParams.push(`%${search}%`);
  }

  if (minPrice) {
    paramCount++;
    queryText += ` AND p.price >= $${paramCount}`;
    queryParams.push(minPrice);
  }

  if (maxPrice) {
    paramCount++;
    queryText += ` AND p.price <= $${paramCount}`;
    queryParams.push(maxPrice);
  }

  // Add sorting
  const validSortFields = ['price', 'created_at', 'name', 'stock_quantity'];
  const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';
  queryText += ` ORDER BY p.${sortField} ${sortOrder}`;

  // Add pagination
  paramCount++;
  queryText += ` LIMIT $${paramCount}`;
  queryParams.push(limit);

  paramCount++;
  queryText += ` OFFSET $${paramCount}`;
  queryParams.push(offset);

  // Execute query
  const result = await pool.query(queryText, queryParams);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
  const countParams: any[] = [];
  let countParamIndex = 0;

  if (category) {
    countParamIndex++;
    countQuery += ` AND c.slug = $${countParamIndex}`;
    countParams.push(category);
  }

  if (search) {
    countParamIndex++;
    countQuery += ` AND (p.name ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex})`;
    countParams.push(`%${search}%`);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: {
      products: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
};

// Get single product by ID or slug
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Try to get from cache first
  const cacheKey = `product:${id}`;
  const cached = await cacheHelpers.get(cacheKey);

  if (cached) {
    res.json({
      success: true,
      data: { product: cached },
      cached: true,
    });
    return;
  }

  // Check if id is UUID or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = isUUID
    ? 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_active = true'
    : 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = $1 AND p.is_active = true';

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Product not found', 404);
  }

  const product = result.rows[0];

  // Cache for 1 hour
  await cacheHelpers.set(cacheKey, product, 3600);

  res.json({
    success: true,
    data: { product },
  });
};

// Create product (admin only)
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    slug,
    description,
    shortDescription,
    price,
    categoryId,
    sku,
    stockQuantity,
    images,
  } = req.body;

  // Validation
  if (!name || !slug || !price) {
    throw new AppError('Name, slug, and price are required', 400);
  }

  const result = await pool.query(
    `INSERT INTO products (name, slug, description, short_description, price, category_id, sku, stock_quantity, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, slug, description, shortDescription, price, categoryId, sku, stockQuantity || 0, JSON.stringify(images || [])]
  );

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product: result.rows[0] },
  });
};

// Update product (admin only)
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  // Build update query dynamically
  const allowedFields = ['name', 'slug', 'description', 'short_description', 'price', 'category_id', 'sku', 'stock_quantity', 'images', 'is_active', 'is_featured'];
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      paramCount++;
      updateFields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
    }
  });

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  paramCount++;
  values.push(id);

  const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new AppError('Product not found', 404);
  }

  // Clear cache
  await cacheHelpers.del(`product:${id}`);

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: { product: result.rows[0] },
  });
};

// Delete product (admin only)
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Product not found', 404);
  }

  // Clear cache
  await cacheHelpers.del(`product:${id}`);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
};
