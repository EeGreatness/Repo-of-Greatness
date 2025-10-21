# Backend Architecture - TechShop Production System

## Overview

This document outlines the complete backend architecture needed to transform TechShop from a frontend demo into a production-ready e-commerce platform.

## Technology Stack

### Core Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **API Style**: RESTful API + GraphQL (optional)

### Database
- **Primary Database**: PostgreSQL 15+
  - ACID compliance for transactions
  - JSON support for flexible data
  - Full-text search capabilities
- **Cache Layer**: Redis 7+
  - Session storage
  - Rate limiting
  - Cart caching
- **Search Engine**: Elasticsearch (optional, for advanced search)

### Authentication & Security
- **Auth Strategy**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **API Security**: Helmet.js, express-rate-limit
- **CORS**: Configured for specific origins
- **Secrets Management**: AWS Secrets Manager / HashiCorp Vault

### Payment Processing
- **Primary**: Stripe
- **Alternative**: PayPal, Square
- **PCI Compliance**: Stripe handles card data (never touch our servers)

### Email Service
- **Transactional Email**: SendGrid / Amazon SES
- **Templates**: Handlebars/Pug
- **Features**: Order confirmations, password resets, shipping updates

### File Storage
- **Images/Assets**: AWS S3 / Cloudinary
- **CDN**: CloudFront / Cloudflare

### Monitoring & Logging
- **APM**: New Relic / DataDog
- **Error Tracking**: Sentry
- **Logging**: Winston + AWS CloudWatch / ELK Stack
- **Uptime Monitoring**: Pingdom / UptimeRobot

### DevOps & Infrastructure
- **Hosting**: AWS / Google Cloud / Azure
- **Container**: Docker
- **Orchestration**: Kubernetes / AWS ECS
- **CI/CD**: GitHub Actions / GitLab CI
- **Load Balancer**: AWS ALB / Nginx

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  (React/Vue/Angular or our current Vanilla JS frontend)    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      CDN / LOAD BALANCER                    │
│                    (CloudFront / Nginx)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                            │
│            (Rate Limiting, Authentication)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Auth       │ │   Products   │ │   Orders     │
│   Service    │ │   Service    │ │   Service    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
        ┌───────────────────────────────┐
        │      PostgreSQL Database       │
        │  ┌──────────────────────────┐ │
        │  │  Users, Products, Orders │ │
        │  │  Payments, Inventory     │ │
        │  └──────────────────────────┘ │
        └───────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    Redis     │ │   Stripe     │ │   SendGrid   │
│   (Cache)    │ │  (Payment)   │ │   (Email)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Database Schema Design

### Core Tables

#### 1. Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

#### 2. Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  sku VARCHAR(100) UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  images JSONB,
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
```

#### 3. Categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. Orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
```

#### 5. Order Items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

#### 6. Shopping Carts
```sql
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  session_id VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_carts_user ON shopping_carts(user_id);
CREATE INDEX idx_carts_session ON shopping_carts(session_id);
```

#### 7. Addresses
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) DEFAULT 'shipping',
  is_default BOOLEAN DEFAULT FALSE,
  full_name VARCHAR(200),
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

#### 8. Payment Methods
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  stripe_payment_method_id VARCHAR(255),
  type VARCHAR(50),
  last4 VARCHAR(4),
  brand VARCHAR(50),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. Reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

#### 10. Inventory Logs
```sql
CREATE TABLE inventory_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  change_type VARCHAR(50),
  quantity_change INTEGER,
  previous_quantity INTEGER,
  new_quantity INTEGER,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints Specification

### Authentication Endpoints

```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
POST   /api/auth/verify-email      - Verify email address
GET    /api/auth/me                - Get current user
```

### Product Endpoints

```
GET    /api/products               - List all products (with pagination, filtering)
GET    /api/products/:id           - Get single product
GET    /api/products/slug/:slug    - Get product by slug
POST   /api/products               - Create product (admin only)
PUT    /api/products/:id           - Update product (admin only)
DELETE /api/products/:id           - Delete product (admin only)
GET    /api/products/:id/reviews   - Get product reviews
POST   /api/products/:id/reviews   - Add product review
```

### Category Endpoints

```
GET    /api/categories             - List all categories
GET    /api/categories/:id         - Get single category
GET    /api/categories/:id/products - Get products in category
POST   /api/categories             - Create category (admin only)
PUT    /api/categories/:id         - Update category (admin only)
DELETE /api/categories/:id         - Delete category (admin only)
```

### Cart Endpoints

```
GET    /api/cart                   - Get current cart
POST   /api/cart/items             - Add item to cart
PUT    /api/cart/items/:id         - Update cart item quantity
DELETE /api/cart/items/:id         - Remove item from cart
DELETE /api/cart                   - Clear cart
POST   /api/cart/sync              - Sync guest cart with user cart
```

### Order Endpoints

```
GET    /api/orders                 - List user orders
GET    /api/orders/:id             - Get single order
POST   /api/orders                 - Create order
PUT    /api/orders/:id/cancel      - Cancel order
GET    /api/orders/:id/invoice     - Get order invoice PDF
POST   /api/orders/:id/return      - Request return/refund
```

### Payment Endpoints

```
POST   /api/payments/create-intent     - Create Stripe payment intent
POST   /api/payments/confirm           - Confirm payment
POST   /api/payments/webhook           - Stripe webhook handler
GET    /api/payments/methods           - Get saved payment methods
POST   /api/payments/methods           - Add payment method
DELETE /api/payments/methods/:id       - Remove payment method
```

### User Profile Endpoints

```
GET    /api/users/profile          - Get user profile
PUT    /api/users/profile          - Update user profile
PUT    /api/users/password         - Change password
GET    /api/users/addresses        - Get user addresses
POST   /api/users/addresses        - Add address
PUT    /api/users/addresses/:id    - Update address
DELETE /api/users/addresses/:id    - Delete address
```

### Admin Endpoints

```
GET    /api/admin/dashboard        - Dashboard statistics
GET    /api/admin/orders           - All orders (with filters)
PUT    /api/admin/orders/:id       - Update order status
GET    /api/admin/users            - All users
PUT    /api/admin/users/:id        - Update user
GET    /api/admin/analytics        - Sales analytics
GET    /api/admin/inventory        - Inventory management
```

## Security Measures

### 1. Authentication
- JWT with short expiration (15 minutes access token)
- Refresh tokens (7 days, stored securely)
- HTTP-only cookies for tokens
- CSRF protection

### 2. Data Validation
- Input sanitization on all endpoints
- Schema validation using Joi or Zod
- SQL injection prevention (use parameterized queries)
- XSS protection (helmet.js)

### 3. Rate Limiting
```javascript
// Login endpoint: 5 attempts per 15 minutes
// API endpoints: 100 requests per 15 minutes per IP
// Payment endpoints: 3 attempts per hour
```

### 4. HTTPS Everywhere
- SSL/TLS certificates (Let's Encrypt)
- HSTS headers
- Secure cookies

### 5. Environment Variables
```
Never commit:
- Database credentials
- API keys (Stripe, SendGrid)
- JWT secrets
- AWS credentials
```

## Payment Flow (Stripe Integration)

```
1. User initiates checkout
   ↓
2. Backend creates Stripe Payment Intent
   ↓
3. Frontend collects payment details (Stripe.js)
   ↓
4. Stripe confirms payment (client-side)
   ↓
5. Backend receives webhook from Stripe
   ↓
6. Verify webhook signature
   ↓
7. Update order status to 'paid'
   ↓
8. Send confirmation email
   ↓
9. Reduce inventory
```

## Email Templates

### Order Confirmation
- Order number and details
- Shipping information
- Estimated delivery date
- Tracking link (when available)

### Password Reset
- Secure token link (expires in 1 hour)
- IP address and timestamp

### Shipping Updates
- Order shipped notification
- Delivery confirmation

## Deployment Architecture

### Production Environment

```
Domain: www.techshop.com
├── Frontend: CloudFront CDN → S3 bucket
├── API: api.techshop.com → Load Balancer
│   ├── EC2 Instance 1 (Auto-scaling)
│   ├── EC2 Instance 2 (Auto-scaling)
│   └── EC2 Instance N
├── Database: RDS PostgreSQL (Multi-AZ)
├── Cache: ElastiCache Redis
├── Storage: S3 for images
└── Monitoring: CloudWatch + Sentry
```

### Environments
- **Development**: Local docker-compose
- **Staging**: Mirrors production (smaller instances)
- **Production**: Full infrastructure

## Cost Estimation (AWS)

### Minimum Viable Production
- **EC2**: 2x t3.medium = $60/month
- **RDS**: db.t3.small = $30/month
- **ElastiCache**: cache.t3.micro = $15/month
- **S3 + CloudFront**: ~$20/month
- **Load Balancer**: $20/month
- **Misc (data transfer, backups)**: $30/month
- **Third-party**: Stripe (2.9% + $0.30), SendGrid ($15)

**Total**: ~$190-250/month + transaction fees

### Scalable Production
- Auto-scaling EC2 instances
- Larger RDS instance
- Multi-region deployment
- **Total**: $500-2000/month depending on traffic

## Development Roadmap

### Phase 1: Core Backend (4-6 weeks)
- Database setup and migrations
- User authentication system
- Product CRUD operations
- Basic order management

### Phase 2: Payments (2-3 weeks)
- Stripe integration
- Payment flow
- Webhook handling
- Refund system

### Phase 3: Features (3-4 weeks)
- Shopping cart persistence
- Email notifications
- Review system
- Admin dashboard

### Phase 4: Production Ready (2-3 weeks)
- Security hardening
- Performance optimization
- Monitoring setup
- Documentation
- Testing (unit, integration, e2e)

### Phase 5: DevOps (1-2 weeks)
- CI/CD pipeline
- Deployment automation
- Backup strategy
- Disaster recovery

**Total Timeline**: 12-18 weeks with 1-2 developers

## Next Steps

1. Set up development environment
2. Initialize backend project with TypeScript + Express
3. Configure PostgreSQL database
4. Implement authentication system
5. Create product and order APIs
6. Integrate Stripe for payments
7. Set up email service
8. Deploy to staging environment
9. Security audit
10. Production deployment

---

This architecture is designed to scale from MVP to handling thousands of concurrent users while maintaining security, reliability, and cost-effectiveness.
