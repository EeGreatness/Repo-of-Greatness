# TechShop - Modern E-Commerce Website

A fully functional, modern e-commerce website built with HTML, CSS, and JavaScript. Features a responsive design, shopping cart with localStorage persistence, and a complete checkout flow.

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

**Built with ❤️ using vanilla HTML, CSS, and JavaScript**
