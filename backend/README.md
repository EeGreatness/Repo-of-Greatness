# TechShop Backend API

Enterprise-grade Node.js/TypeScript REST API for TechShop e-commerce platform.

## Quick Start

### Using Docker (Recommended)

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development environment
docker-compose --profile development up

# API available at http://localhost:5000
# PostgreSQL at localhost:5432
# Redis at localhost:6379
# pgAdmin at http://localhost:5050 (admin@techshop.com / admin)
```

### Manual Setup

```bash
# Install dependencies
npm install

# Set up PostgreSQL database
createdb techshop_db

# Run migrations
psql techshop_db < database/migrations/001_initial_schema.sql

# Seed database with sample data
psql techshop_db < database/seeds/001_seed_data.sql

# Copy and configure environment
cp .env.example .env
nano .env

# Start development server
npm run dev
```

## Environment Variables

Required variables in `.env`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techshop_db
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/techshop_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid (get from https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@techshop.com

# URLs
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint              | Description             | Auth Required |
|--------|----------------------|-------------------------|---------------|
| POST   | `/register`          | Register new user       | No            |
| POST   | `/login`             | Login user              | No            |
| POST   | `/refresh`           | Refresh access token    | No            |
| POST   | `/logout`            | Logout user             | No            |
| GET    | `/me`                | Get current user        | Yes           |
| POST   | `/verify-email`      | Verify email address    | No            |
| POST   | `/forgot-password`   | Request password reset  | No            |
| POST   | `/reset-password`    | Reset password          | No            |

### Products (`/api/products`)

| Method | Endpoint   | Description          | Auth Required |
|--------|-----------|----------------------|---------------|
| GET    | `/`       | List all products    | No            |
| GET    | `/:id`    | Get single product   | No            |
| POST   | `/`       | Create product       | Admin         |
| PUT    | `/:id`    | Update product       | Admin         |
| DELETE | `/:id`    | Delete product       | Admin         |

**Query Parameters for GET /**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `category` - Filter by category slug
- `search` - Search in name/description
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field (price, created_at, name, stock_quantity)
- `order` - Sort order (ASC, DESC)

### Shopping Cart (`/api/cart`)

| Method | Endpoint                | Description              | Auth Required |
|--------|------------------------|--------------------------|---------------|
| GET    | `/`                    | Get current cart         | Optional      |
| POST   | `/items`               | Add item to cart         | Optional      |
| PUT    | `/items/:productId`    | Update item quantity     | Optional      |
| DELETE | `/items/:productId`    | Remove item from cart    | Optional      |
| DELETE | `/`                    | Clear cart               | Optional      |
| POST   | `/validate`            | Validate cart            | Optional      |
| POST   | `/sync`                | Sync guest cart on login | Yes           |

**Note**: Cart works for both authenticated users and guests (using session cookies).

### Orders (`/api/orders`)

| Method | Endpoint            | Description           | Auth Required |
|--------|--------------------|-----------------------|---------------|
| GET    | `/`                | Get user's orders     | Yes           |
| GET    | `/:id`             | Get single order      | Yes           |
| POST   | `/`                | Create new order      | Optional      |
| PUT    | `/:id/cancel`      | Cancel order          | Yes           |
| PUT    | `/:id/status`      | Update order status   | Admin         |
| GET    | `/admin/stats`     | Get order statistics  | Admin         |

### Admin Dashboard (`/api/admin`)

| Method | Endpoint              | Description                     | Auth Required |
|--------|-----------------------|---------------------------------|---------------|
| GET    | `/dashboard`          | Dashboard statistics & metrics  | Admin         |
| GET    | `/users`              | List all users (filtered)       | Admin         |
| GET    | `/users/:id`          | Get user details & statistics   | Admin         |
| PUT    | `/users/:id`          | Update user (role, status)      | Admin         |
| PUT    | `/users/:id/deactivate` | Deactivate user account       | Admin         |
| GET    | `/orders`             | List all orders (advanced filters) | Admin      |
| GET    | `/inventory`          | Inventory report (stock levels) | Admin         |
| GET    | `/inventory/logs`     | Inventory change logs           | Admin         |
| PUT    | `/products/bulk`      | Bulk update products            | Admin         |
| GET    | `/analytics/sales`    | Sales analytics & reports       | Admin         |

**Dashboard Statistics** includes:
- Order statistics (total, by status, avg value)
- User statistics (total, verified, active)
- Product statistics (total, active, stock status)
- Revenue metrics (total, tax, shipping)
- Recent orders list
- Top selling products
- Revenue by day (last 30 days)

**User Management** features:
- Filter by role, status, email verification
- Search by email/name
- View user order history and statistics
- Update user roles and permissions
- Deactivate/reactivate accounts

**Order Management** features:
- Advanced filtering (status, payment, date, amount)
- Search by order number, email, name
- Bulk operations support
- Export capabilities

**Inventory Management** features:
- Stock status monitoring (in stock, low stock, out of stock)
- Inventory change logs with audit trail
- Bulk product updates
- Stock level alerts

**Analytics & Reports** include:
- Revenue over time (daily/weekly/monthly)
- Sales by category
- Top customers by spend
- Order trends and patterns

## Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # PostgreSQL connection
│   │   └── redis.ts         # Redis connection
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   ├── productController.ts
│   │   ├── cartController.ts
│   │   └── orderController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication & authorization
│   │   ├── errorHandler.ts  # Error handling
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── cartRoutes.ts
│   │   └── orderRoutes.ts
│   ├── services/            # Business logic
│   │   ├── emailService.ts  # Email sending
│   │   └── stripeService.ts # Payment processing
│   ├── utils/               # Utility functions
│   │   └── jwt.ts           # JWT helpers
│   └── server.ts            # Main server file
├── database/
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
├── .env.example             # Environment template
├── Dockerfile               # Production Docker image
├── docker-compose.yml       # Local development setup
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Create routes in `src/routes/`
3. Add route to `src/server.ts`
4. Update this README

### Database Migrations

```bash
# Create new migration
psql $DATABASE_URL < database/migrations/002_new_migration.sql

# Rollback (create rollback script manually)
psql $DATABASE_URL < database/migrations/002_rollback.sql
```

## Testing

### Manual API Testing

Using curl:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get products
curl http://localhost:5000/api/products

# Add to cart (replace TOKEN with access token from login)
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "productId": "product-uuid-here",
    "quantity": 2
  }'
```

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for production deployment instructions.

### Docker Production

```bash
# Build image
docker build -t techshop-api .

# Run container
docker run -p 5000:5000 --env-file .env techshop-api
```

## Security

- JWT authentication with refresh tokens
- bcrypt password hashing (10 rounds)
- Rate limiting on all endpoints
- CORS with origin whitelist
- Helmet.js security headers
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF protection (for future implementation)

## Performance

- Redis caching for products and sessions
- Database connection pooling
- Response compression
- Optimized database queries with indexes
- Lazy loading and pagination

## Troubleshooting

### Database connection errors

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql $DATABASE_URL -c "SELECT NOW()"
```

### Redis connection errors

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port already in use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Migration errors

```bash
# Drop and recreate database
dropdb techshop_db
createdb techshop_db
psql techshop_db < database/migrations/001_initial_schema.sql
psql techshop_db < database/seeds/001_seed_data.sql
```

## License

MIT

## Support

For issues or questions:
- Check this README
- Review [BACKEND_ARCHITECTURE.md](../BACKEND_ARCHITECTURE.md)
- Review [DEPLOYMENT.md](../DEPLOYMENT.md)
- Contact: dev@techshop.com
