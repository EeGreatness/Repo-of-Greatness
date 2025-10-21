// Product Catalog
const products = [
    {
        id: 1,
        name: "Wireless Headphones Pro",
        category: "audio",
        price: 299.99,
        description: "Premium noise-cancelling headphones with 30-hour battery life",
        icon: "🎧",
        rating: 4.8
    },
    {
        id: 2,
        name: "Smart Watch Ultra",
        category: "electronics",
        price: 399.99,
        description: "Advanced fitness tracking and health monitoring device",
        icon: "⌚",
        rating: 4.6
    },
    {
        id: 3,
        name: "Laptop Stand Aluminum",
        category: "accessories",
        price: 49.99,
        description: "Ergonomic adjustable laptop stand for better posture",
        icon: "💻",
        rating: 4.7
    },
    {
        id: 4,
        name: "Mechanical Keyboard RGB",
        category: "electronics",
        price: 149.99,
        description: "Cherry MX switches with customizable RGB lighting",
        icon: "⌨️",
        rating: 4.9
    },
    {
        id: 5,
        name: "Wireless Mouse Gaming",
        category: "electronics",
        price: 79.99,
        description: "High-precision gaming mouse with 16000 DPI sensor",
        icon: "🖱️",
        rating: 4.5
    },
    {
        id: 6,
        name: "USB-C Hub 7-in-1",
        category: "accessories",
        price: 59.99,
        description: "Multi-port adapter with HDMI, USB 3.0, and SD card reader",
        icon: "🔌",
        rating: 4.4
    },
    {
        id: 7,
        name: "Bluetooth Speaker Portable",
        category: "audio",
        price: 129.99,
        description: "Waterproof speaker with 360° sound and 20-hour battery",
        icon: "🔊",
        rating: 4.6
    },
    {
        id: 8,
        name: "Webcam 4K HD",
        category: "electronics",
        price: 159.99,
        description: "Professional webcam with auto-focus and noise reduction",
        icon: "📹",
        rating: 4.7
    },
    {
        id: 9,
        name: "Phone Case Premium",
        category: "accessories",
        price: 29.99,
        description: "Military-grade drop protection with wireless charging support",
        icon: "📱",
        rating: 4.3
    },
    {
        id: 10,
        name: "Earbuds True Wireless",
        category: "audio",
        price: 179.99,
        description: "Active noise cancellation with transparency mode",
        icon: "🎵",
        rating: 4.8
    },
    {
        id: 11,
        name: "Monitor 27 inch 4K",
        category: "electronics",
        price: 499.99,
        description: "Ultra HD display with HDR support and 144Hz refresh rate",
        icon: "🖥️",
        rating: 4.9
    },
    {
        id: 12,
        name: "Cable Organizer Set",
        category: "accessories",
        price: 19.99,
        description: "Complete cable management solution for desk and travel",
        icon: "🧵",
        rating: 4.2
    },
    {
        id: 13,
        name: "Power Bank 20000mAh",
        category: "accessories",
        price: 69.99,
        description: "Fast charging portable battery with dual USB-C ports",
        icon: "🔋",
        rating: 4.5
    },
    {
        id: 14,
        name: "Gaming Headset RGB",
        category: "audio",
        price: 119.99,
        description: "Surround sound gaming headset with detachable microphone",
        icon: "🎮",
        rating: 4.6
    },
    {
        id: 15,
        name: "Tablet Pro 12.9 inch",
        category: "electronics",
        price: 899.99,
        description: "Professional tablet with stylus support and M2 chip",
        icon: "📱",
        rating: 4.9
    }
];

// Render products to the grid
function renderProducts(filterCategory = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Filter products based on category
    const filteredProducts = filterCategory === 'all'
        ? products
        : products.filter(p => p.category === filterCategory);

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">${product.icon}</div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get product by ID
function getProductById(id) {
    return products.find(p => p.id === id);
}

// Initialize products on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderProducts());
} else {
    renderProducts();
}
