// Checkout Page Functionality

// Load order summary on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    setupFormValidation();
    setupCardFormatting();
});

// Load order summary from cart
function loadOrderSummary() {
    const cart = getCart();
    const summaryItems = document.getElementById('summaryItems');

    if (!summaryItems) return;

    if (cart.length === 0) {
        summaryItems.innerHTML = `
            <p style="text-align: center; color: #64748b; padding: 2rem;">
                Your cart is empty. <a href="index.html" style="color: #2563eb;">Continue shopping</a>
            </p>
        `;
        return;
    }

    // Render summary items
    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div class="summary-item-info">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <div class="summary-item-price">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    // Calculate totals
    const subtotal = calculateTotal();
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Update totals
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping > 0 ? `$${shipping.toFixed(2)}` : 'FREE';
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            processOrder();
        }
    });
}

// Validate form inputs
function validateForm() {
    const form = document.getElementById('checkoutForm');
    let isValid = true;
    let errorMessages = [];

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-group input').forEach(input => {
        input.style.borderColor = '#e2e8f0';
    });

    // Validate required fields
    const requiredFields = form.querySelectorAll('input[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });

    // Validate email
    const email = document.getElementById('email');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailPattern.test(email.value)) {
        showFieldError(email, 'Please enter a valid email address');
        isValid = false;
    }

    // Validate phone
    const phone = document.getElementById('phone');
    const phonePattern = /^[\d\s\-\(\)]+$/;
    if (phone.value && !phonePattern.test(phone.value)) {
        showFieldError(phone, 'Please enter a valid phone number');
        isValid = false;
    }

    // Validate ZIP code
    const zipCode = document.getElementById('zipCode');
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (zipCode.value && !zipPattern.test(zipCode.value)) {
        showFieldError(zipCode, 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
        isValid = false;
    }

    // Validate card number
    const cardNumber = document.getElementById('cardNumber');
    const cleanCardNumber = cardNumber.value.replace(/\s/g, '');
    if (cardNumber.value && (cleanCardNumber.length < 13 || cleanCardNumber.length > 19)) {
        showFieldError(cardNumber, 'Please enter a valid card number');
        isValid = false;
    }

    // Validate expiry date
    const expiry = document.getElementById('expiry');
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (expiry.value && !expiryPattern.test(expiry.value)) {
        showFieldError(expiry, 'Please enter a valid expiry date (MM/YY)');
        isValid = false;
    } else if (expiry.value) {
        // Check if card is expired
        const [month, year] = expiry.value.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const today = new Date();
        if (expiryDate < today) {
            showFieldError(expiry, 'Card has expired');
            isValid = false;
        }
    }

    // Validate CVV
    const cvv = document.getElementById('cvv');
    if (cvv.value && (cvv.value.length < 3 || cvv.value.length > 4)) {
        showFieldError(cvv, 'Please enter a valid CVV (3 or 4 digits)');
        isValid = false;
    }

    return isValid;
}

// Show field error
function showFieldError(field, message) {
    field.style.borderColor = '#ef4444';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
    errorDiv.textContent = message;

    field.parentElement.appendChild(errorDiv);
}

// Setup card number and date formatting
function setupCardFormatting() {
    // Format card number with spaces
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        // Only allow numbers
        cardNumber.addEventListener('keypress', function(e) {
            if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }

    // Format expiry date
    const expiry = document.getElementById('expiry');
    if (expiry) {
        expiry.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    // Only allow numbers for CVV
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('keypress', function(e) {
            if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }

    // Only allow numbers for ZIP code
    const zipCode = document.getElementById('zipCode');
    if (zipCode) {
        zipCode.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^\d-]/g, '');
        });
    }
}

// Process order
function processOrder() {
    const form = document.getElementById('checkoutForm');
    const submitButton = form.querySelector('button[type="submit"]');

    // Show loading state
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitButton.disabled = true;

    // Simulate order processing
    setTimeout(() => {
        // Generate order number
        const orderNumber = 'ORD-' + Date.now().toString().slice(-8);

        // Clear cart
        localStorage.removeItem('techshop_cart');

        // Show success modal
        showSuccessModal(orderNumber);

        // Reset button
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;

        // Reset form
        form.reset();
    }, 2000);
}

// Show success modal
function showSuccessModal(orderNumber) {
    const modal = document.getElementById('successModal');
    const orderNumberElement = document.getElementById('orderNumber');

    if (modal && orderNumberElement) {
        orderNumberElement.textContent = orderNumber;
        modal.classList.add('active');

        // Send order confirmation email (simulation)
        console.log('Order confirmation sent for order:', orderNumber);

        // Store order in localStorage for order history
        const orders = JSON.parse(localStorage.getItem('techshop_orders') || '[]');
        orders.push({
            orderNumber,
            date: new Date().toISOString(),
            items: getCart(),
            total: calculateOrderTotal()
        });
        localStorage.setItem('techshop_orders', JSON.stringify(orders));
    }
}

// Calculate order total
function calculateOrderTotal() {
    const subtotal = calculateTotal();
    const shipping = subtotal > 0 ? 9.99 : 0;
    const tax = subtotal * 0.08;
    return subtotal + shipping + tax;
}

// Add custom styling for error messages
const style = document.createElement('style');
style.textContent = `
    .error-message {
        animation: shake 0.3s ease;
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
