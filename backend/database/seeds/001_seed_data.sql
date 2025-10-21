-- Seed Data for TechShop
-- Run after initial schema migration

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (id, name, slug, description, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'electronics', 'Computers, keyboards, mice, and other electronic devices', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Audio', 'audio', 'Headphones, speakers, earbuds, and audio accessories', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Accessories', 'accessories', 'Tech accessories including cables, stands, and cases', true);

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO products (name, slug, description, short_description, price, category_id, sku, stock_quantity, images, is_active, is_featured) VALUES

-- Audio Products
('Wireless Headphones Pro', 'wireless-headphones-pro',
  'Premium noise-cancelling headphones with advanced audio technology. Features 30-hour battery life, comfortable over-ear design, and exceptional sound quality. Perfect for music lovers, travelers, and professionals who demand the best audio experience.',
  'Premium noise-cancelling headphones with 30-hour battery life',
  299.99,
  '550e8400-e29b-41d4-a716-446655440002',
  'WHP-001',
  50,
  '["🎧"]',
  true,
  true),

('Bluetooth Speaker Portable', 'bluetooth-speaker-portable',
  'Waterproof portable speaker with 360° sound and exceptional bass. IPX7 waterproof rating means you can take it anywhere - beach, pool, or camping. 20-hour battery life ensures your music never stops. Compact design fits in any bag.',
  'Waterproof speaker with 360° sound and 20-hour battery',
  129.99,
  '550e8400-e29b-41d4-a716-446655440002',
  'BSP-001',
  75,
  '["🔊"]',
  true,
  true),

('Earbuds True Wireless', 'earbuds-true-wireless',
  'Experience audio freedom with these true wireless earbuds. Active noise cancellation blocks out distractions while transparency mode lets you hear your surroundings when needed. Ergonomic design ensures all-day comfort. Touch controls make it easy to manage music and calls.',
  'Active noise cancellation with transparency mode',
  179.99,
  '550e8400-e29b-41d4-a716-446655440002',
  'ETW-001',
  100,
  '["🎵"]',
  true,
  false),

('Gaming Headset RGB', 'gaming-headset-rgb',
  'Immersive 7.1 surround sound gaming headset with customizable RGB lighting. Crystal-clear detachable microphone with noise cancellation. Memory foam ear cushions provide comfort during marathon gaming sessions. Compatible with PC, PS5, Xbox, and Nintendo Switch.',
  'Surround sound gaming headset with detachable microphone',
  119.99,
  '550e8400-e29b-41d4-a716-446655440002',
  'GHS-001',
  60,
  '["🎮"]',
  true,
  false),

-- Electronics
('Smart Watch Ultra', 'smart-watch-ultra',
  'Advanced fitness tracking and health monitoring smartwatch. Monitors heart rate, blood oxygen, sleep quality, and tracks 100+ workout modes. Built-in GPS, water resistant to 50m, and 7-day battery life. Receive notifications, control music, and make payments from your wrist.',
  'Advanced fitness tracking and health monitoring device',
  399.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'SWU-001',
  40,
  '["⌚"]',
  true,
  true),

('Mechanical Keyboard RGB', 'mechanical-keyboard-rgb',
  'Professional mechanical keyboard with authentic Cherry MX switches. Per-key RGB lighting with 16.8 million colors. Programmable macros, N-key rollover, and dedicated media controls. Aircraft-grade aluminum frame ensures durability. Perfect for gaming and typing.',
  'Cherry MX switches with customizable RGB lighting',
  149.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'MKR-001',
  80,
  '["⌨️"]',
  true,
  true),

('Wireless Mouse Gaming', 'wireless-mouse-gaming',
  'Ultra-responsive wireless gaming mouse with industry-leading 16000 DPI sensor. Lag-free 1ms response time, customizable RGB lighting, and programmable buttons. Ergonomic design prevents fatigue. Rechargeable battery lasts up to 70 hours on a single charge.',
  'High-precision gaming mouse with 16000 DPI sensor',
  79.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'WMG-001',
  90,
  '["🖱️"]',
  true,
  false),

('Webcam 4K HD', 'webcam-4k-hd',
  'Professional 4K webcam perfect for streaming, video conferencing, and content creation. Auto-focus ensures you always look sharp. Built-in dual microphones with noise reduction. Wide 90° field of view. Compatible with Windows, Mac, and Chrome OS. Plug and play - no drivers needed.',
  'Professional webcam with auto-focus and noise reduction',
  159.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'W4K-001',
  45,
  '["📹"]',
  true,
  false),

('Monitor 27 inch 4K', 'monitor-27-inch-4k',
  'Stunning 27-inch 4K Ultra HD display with HDR10 support. 144Hz refresh rate and 1ms response time make it perfect for gaming and content creation. IPS panel provides accurate colors and wide viewing angles. Height-adjustable stand with tilt, swivel, and pivot. VESA mount compatible.',
  'Ultra HD display with HDR support and 144Hz refresh rate',
  499.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'MON-001',
  25,
  '["🖥️"]',
  true,
  true),

('Tablet Pro 12.9 inch', 'tablet-pro-129-inch',
  'Powerful professional tablet with M2 chip for desktop-class performance. Stunning 12.9-inch Liquid Retina XDR display. Works seamlessly with Apple Pencil (2nd generation) for drawing and note-taking. All-day battery life. Perfect for artists, students, and professionals on the go.',
  'Professional tablet with stylus support and M2 chip',
  899.99,
  '550e8400-e29b-41d4-a716-446655440001',
  'TAB-001',
  30,
  '["📱"]',
  true,
  true),

-- Accessories
('Laptop Stand Aluminum', 'laptop-stand-aluminum',
  'Ergonomic adjustable laptop stand crafted from premium aluminum. Raises your laptop to eye level reducing neck and shoulder strain. Ventilated design improves airflow keeping your laptop cool. Adjustable height and angle. Supports laptops from 10 to 17 inches. Non-slip silicone pads protect your device.',
  'Ergonomic adjustable laptop stand for better posture',
  49.99,
  '550e8400-e29b-41d4-a716-446655440003',
  'LSA-001',
  120,
  '["💻"]',
  true,
  false),

('USB-C Hub 7-in-1', 'usb-c-hub-7in1',
  'Expand your laptop connectivity with this versatile 7-in-1 USB-C hub. Includes 4K HDMI port, 3x USB 3.0 ports (5Gbps), SD/microSD card readers, and USB-C PD charging port (100W). Aluminum construction matches MacBook design. Plug and play - no drivers needed. Perfect for professionals and students.',
  'Multi-port adapter with HDMI, USB 3.0, and SD card reader',
  59.99,
  '550e8400-e29b-41d4-a716-446655440003',
  'UCH-001',
  150,
  '["🔌"]',
  true,
  false),

('Phone Case Premium', 'phone-case-premium',
  'Military-grade drop protection meets sleek design. Tested to survive drops from 10 feet. Raised bezels protect screen and camera. Supports wireless charging and MagSafe. Slim profile adds minimal bulk. Available for iPhone and Samsung Galaxy models. Lifetime warranty included.',
  'Military-grade drop protection with wireless charging support',
  29.99,
  '550e8400-e29b-41d4-a716-446655440003',
  'PCP-001',
  200,
  '["📱"]',
  true,
  false),

('Cable Organizer Set', 'cable-organizer-set',
  'Complete cable management solution for home and office. Includes cable clips, sleeves, ties, and box. Keeps desk tidy and cables organized. Self-adhesive design works on any surface. Includes 20+ pieces in various sizes. Perfect for desk setup, entertainment centers, and travel. Reusable and durable.',
  'Complete cable management solution for desk and travel',
  19.99,
  '550e8400-e29b-41d4-a716-446655440003',
  'COS-001',
  250,
  '["🧵"]',
  true,
  false),

('Power Bank 20000mAh', 'power-bank-20000mah',
  'Never run out of battery with this high-capacity 20000mAh power bank. Charge up to 3 devices simultaneously with dual USB-C ports and USB-A port. 65W PD fast charging can charge a laptop, tablet, and phone. LED display shows remaining battery. Compact design fits in any bag. Flight-safe.',
  'Fast charging portable battery with dual USB-C ports',
  69.99,
  '550e8400-e29b-41d4-a716-446655440003',
  'PWB-001',
  100,
  '["🔋"]',
  true,
  false);

-- ============================================
-- ADMIN USER
-- ============================================
-- Password: Admin123!
-- Use bcrypt with 10 rounds to hash in production
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active) VALUES
  ('admin@techshop.com', '$2b$10$rQ5K7b5h5h5h5h5h5h5h5uXxGxGxGxGxGxGxGxGxGxGxGxGxGxGxGx', 'Admin', 'User', 'admin', true, true);

COMMENT ON TABLE users IS 'Default admin credentials: admin@techshop.com / Admin123! (Change immediately in production!)';
