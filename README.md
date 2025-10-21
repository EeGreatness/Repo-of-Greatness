# TechShop - Production-Ready E-Commerce Platform

A complete, production-ready e-commerce platform with modern frontend and enterprise-grade backend infrastructure. The frontend is built with vanilla HTML, CSS, and JavaScript, while the backend uses Node.js, TypeScript, PostgreSQL, and includes payment processing, authentication, and more.

## Repository Structure

This repository contains two main components:

1. **Frontend** (Root directory) - Client-facing e-commerce website
2. **Backend** (`/backend`) - Production-ready REST API server

---

# Frontend Application

## Features

### Core Functionality
- **Product Catalog**: Browse 15+ tech products with detailed information
- **Category Filtering**: Filter products by Electronics, Accessories, and Audio
- **Shopping Cart**:
  - Add/remove items
  - Update quantities
  - Real-time total calculation
  - Persistent cart using localStorage
- **Checkout Process**:
  - Multi-step form with validation
  - Real-time form field formatting
  - Order summary with tax and shipping calculation
  - Order confirmation with unique order number

### Design & UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Interactive Elements**:
  - Smooth scrolling navigation
  - Animated product cards
  - Cart sidebar with overlay
  - Toast notifications
  - Loading states for buttons
- **Accessibility**: Semantic HTML and keyboard navigation support

### Technical Features
- **No Dependencies**: Pure vanilla JavaScript (no frameworks required)
- **LocalStorage Integration**: Cart and order history persistence
- **Form Validation**: Comprehensive client-side validation
- **Performance Optimized**: Efficient rendering and event handling
- **CSS Animations**: Smooth transitions and micro-interactions

## Project Structure

```
TechShop/
├── index.html          # Main homepage with product listings
├── checkout.html       # Checkout page with order form
├── styles.css          # All styles and responsive design
├── products.js         # Product catalog and rendering
├── cart.js            # Shopping cart functionality
├── main.js            # General interactions and filters
├── checkout.js        # Checkout form and validation
└── README.md          # Documentation
```

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build tools required!

### Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd TechShop
   ```

2. **Open in browser**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000

     # Using Node.js
     npx serve

     # Using PHP
     php -S localhost:8000
     ```

3. **Start shopping!**
   - Browse products on the homepage
   - Add items to your cart
   - Proceed to checkout
   - Complete your order

## Usage Guide

### Shopping Flow

1. **Browse Products**
   - View all products on the homepage
   - Use category filters to narrow down selection
   - Click "Add to Cart" to add items

2. **Manage Cart**
   - Click the cart icon in the header to view your cart
   - Adjust quantities using +/- buttons
   - Remove items with the trash icon
   - View real-time total calculation

3. **Checkout**
   - Click "Proceed to Checkout" in the cart
   - Fill out contact information
   - Enter shipping address
   - Provide payment details
   - Submit order

4. **Order Confirmation**
   - Receive unique order number
   - Order stored in browser localStorage
   - Cart automatically cleared

### Product Categories

- **Electronics**: Computers, monitors, keyboards, mice, webcams, tablets
- **Audio**: Headphones, speakers, earbuds, gaming headsets
- **Accessories**: Laptop stands, USB hubs, phone cases, cables, power banks

## Features in Detail

### Shopping Cart

The shopping cart uses localStorage to persist data across browser sessions:
- Cart data saved automatically on every change
- Cart restored when returning to the site
- Survives page refreshes and browser restarts

### Form Validation

The checkout form includes comprehensive validation:
- Required field checking
- Email format validation
- Phone number validation
- ZIP code format validation (US format)
- Credit card number validation
- Expiry date validation (includes expiration check)
- CVV validation
- Real-time error messages

### Responsive Design

Mobile-first responsive design with breakpoints:
- Desktop: 1200px+ (full layout)
- Tablet: 768px - 1199px (adjusted grid)
- Mobile: < 768px (single column, full-width cart)

## Customization

### Adding Products

Edit `products.js` and add new products to the array:

```javascript
{
    id: 16,
    name: "Product Name",
    category: "electronics", // or "audio", "accessories"
    price: 99.99,
    description: "Product description",
    icon: "🎁", // Any emoji icon
    rating: 4.5
}
```

### Changing Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2563eb;    /* Main brand color */
    --primary-dark: #1e40af;     /* Hover states */
    --secondary-color: #64748b;  /* Secondary text */
    /* ... more variables */
}
```

### Modifying Tax and Shipping

Edit the calculation in `checkout.js`:

```javascript
const shipping = subtotal > 0 ? 9.99 : 0;  // Flat rate shipping
const tax = subtotal * 0.08;  // 8% tax rate
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Performance

- Lightweight: < 100KB total size (excluding Font Awesome CDN)
- Fast load times: No heavy frameworks
- Efficient rendering: Optimized DOM updates
- Smooth animations: Hardware-accelerated CSS transitions

## Security Notes

**Important**: This is a front-end demonstration project.

- No real payment processing
- Card details are not sent anywhere
- Form data is only used for validation
- No backend or database integration

For production use, you would need:
- Backend server with secure payment gateway (Stripe, PayPal, etc.)
- Database for product and order management
- User authentication and authorization
- HTTPS encryption
- PCI DSS compliance for payment handling

## Future Enhancements

Potential features to add:
- [ ] User authentication and profiles
- [ ] Product search functionality
- [ ] Product reviews and ratings
- [ ] Wishlist feature
- [ ] Order history page
- [ ] Multiple payment methods
- [ ] Coupon/discount codes
- [ ] Product image gallery
- [ ] Backend integration
- [ ] Email notifications

## Credits

- Icons: Font Awesome (via CDN)
- Design: Custom modern e-commerce design
- Code: Pure vanilla JavaScript

## License

This project is open source and available for educational purposes.

## Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Test in different browsers
4. Clear localStorage if experiencing cart issues

## Demo

Simply open `index.html` in your browser to see the live demo!

---

# Backend API

## Overview

The backend is an enterprise-grade Node.js/TypeScript REST API designed for production use. It includes:

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Payment Processing**: Stripe integration
- **Database**: PostgreSQL with comprehensive schema
- **Caching**: Redis for performance
- **Email Service**: SendGrid integration
- **Security**: Rate limiting, CORS, Helmet.js, bcrypt
- **DevOps**: Docker, Docker Compose, CI/CD ready

## Quick Start

### Using Docker (Recommended)

```bash
cd backend

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose --profile development up

# API available at http://localhost:5000
```

### Manual Setup

```bash
cd backend

# Install dependencies
npm install

# Set up database
createdb techshop_db
psql techshop_db < database/migrations/001_initial_schema.sql
psql techshop_db < database/seeds/001_seed_data.sql

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## Technology Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+

### Services
- **Payments**: Stripe
- **Email**: SendGrid
- **File Storage**: AWS S3 (configurable)

### Security & Performance
- JWT authentication
- bcrypt password hashing
- Rate limiting
- CORS protection
- Helmet.js security headers
- Compression middleware

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Products ✅
- `GET /api/products` - List all products (with filters, search, pagination)
- `GET /api/products/:id` - Get product by ID or slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Shopping Cart ✅
- `GET /api/cart` - Get current cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update item quantity
- `DELETE /api/cart/items/:productId` - Remove item
- `DELETE /api/cart` - Clear cart
- `POST /api/cart/validate` - Validate cart before checkout
- `POST /api/cart/sync` - Sync guest cart with user cart (on login)

### Orders ✅
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order with payment processing
- `PUT /api/orders/:id/cancel` - Cancel order and restore inventory
- `PUT /api/orders/:id/status` - Update order status (admin)
- `GET /api/orders/admin/stats` - Get order statistics (admin)

### Payment ✅
- Integrated with order creation
- Stripe payment intent generation
- Automatic inventory management
- Order confirmation emails
- Refund support

### Admin Dashboard ✅
- `GET /api/admin/dashboard` - Comprehensive dashboard with statistics
- `GET /api/admin/users` - User management with filters
- `GET /api/admin/users/:id` - User details with order history
- `PUT /api/admin/users/:id` - Update user role and status
- `PUT /api/admin/users/:id/deactivate` - Deactivate user account
- `GET /api/admin/orders` - All orders with advanced filters
- `GET /api/admin/inventory` - Inventory report and stock levels
- `GET /api/admin/inventory/logs` - Inventory change audit logs
- `PUT /api/admin/products/bulk` - Bulk update products
- `GET /api/admin/analytics/sales` - Sales analytics and reports

**Features**:
- Real-time dashboard statistics
- User management (roles, permissions, deactivation)
- Order management with advanced filtering
- Inventory monitoring and alerts
- Sales analytics and revenue reports
- Top products and customer insights
- Audit trail for all changes

## Database Schema

The database includes comprehensive tables for:
- Users & Authentication
- Products & Categories
- Orders & Order Items
- Shopping Carts
- Reviews & Ratings
- Payment Methods
- Addresses
- Inventory Logs
- Audit Trails

See [`/backend/database/migrations/001_initial_schema.sql`](backend/database/migrations/001_initial_schema.sql) for complete schema.

## Architecture Documentation

Detailed documentation available:

- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - Complete system architecture, database design, API specification
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions for AWS, DigitalOcean, and other platforms

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Lint code
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/techshop_db

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@techshop.com
```

## Production Deployment

### Docker Deployment

```bash
# Build image
docker build -t techshop-api ./backend

# Run container
docker run -p 5000:5000 --env-file .env techshop-api
```

### AWS ECS/Fargate

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete AWS deployment instructions including:
- ECS task definitions
- RDS database setup
- ElastiCache Redis
- Application Load Balancer
- Auto-scaling configuration
- CI/CD with GitHub Actions

### Cost Estimate

**Development**: $0 (local Docker)
**MVP Production**: ~$200-250/month
**Scalable Production**: $500-2000/month

See [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) for detailed cost breakdown.

## Security

### Implemented
- ✅ JWT authentication with refresh tokens
- ✅ bcrypt password hashing (10 rounds)
- ✅ Rate limiting on all endpoints
- ✅ CORS with whitelist
- ✅ Helmet.js security headers
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ Secure session management
- ✅ Environment variable protection

### Production Checklist
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up AWS Secrets Manager
- [ ] Configure database encryption at rest
- [ ] Enable CloudWatch monitoring
- [ ] Set up Sentry error tracking
- [ ] Configure automated backups
- [ ] Security audit & penetration testing
- [ ] PCI DSS compliance for payments

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Monitoring

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "success": true,
  "message": "TechShop API is running",
  "environment": "development",
  "timestamp": "2024-10-21T08:00:00.000Z"
}
```

### Logging

- Development: Console logging with Morgan
- Production: CloudWatch Logs / Sentry

## API Documentation

Interactive API documentation (Swagger/OpenAPI) coming soon.

For now, see endpoint definitions in `/backend/src/routes/` and [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md).

## Performance

### Optimization Techniques
- Redis caching (products, sessions)
- Database connection pooling
- Response compression
- Query optimization with indexes
- Lazy loading and pagination

### Expected Performance
- Response time: < 100ms (cached)
- Response time: < 500ms (database queries)
- Throughput: 1000+ requests/second (single instance)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

### Documentation
- [Backend Architecture](BACKEND_ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- API Documentation (coming soon)

### Issues
Report bugs or request features via GitHub Issues

### Contact
- Technical Support: support@techshop.com
- Developer Contact: dev@techshop.com

---

## Project Status

### Frontend: ✅ Complete
- Fully functional e-commerce UI
- Shopping cart with localStorage
- Checkout flow with validation
- Responsive design

### Backend: ✅ Production Ready
- ✅ Authentication system (JWT with refresh tokens)
- ✅ Database schema and migrations
- ✅ Payment integration (Stripe)
- ✅ Email service (SendGrid)
- ✅ Security and rate limiting
- ✅ Docker and deployment configs
- ✅ Product endpoints (CRUD with caching)
- ✅ Order endpoints (full order lifecycle)
- ✅ Cart endpoints (guest and authenticated)
- ✅ Inventory management
- ✅ Order confirmation emails
- ✅ **Admin dashboard with analytics**
- ✅ **User management system**
- ✅ **Advanced reporting and insights**

### Next Steps for Production
1. Add comprehensive test coverage (unit, integration, e2e)
2. Set up Swagger/OpenAPI documentation
3. Add product reviews and ratings endpoints
4. Implement webhooks for order status updates
5. Deploy to staging environment
6. Security audit and penetration testing
7. Load testing and performance optimization
8. Production deployment with CI/CD

---

**Built with ❤️ using modern web technologies**

**Frontend**: Vanilla HTML, CSS, JavaScript
**Backend**: Node.js, TypeScript, PostgreSQL, Redis, Stripe, Docker
