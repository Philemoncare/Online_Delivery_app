-- Enum for User Roles
CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'rider', 'admin');

-- Enum for Order Status
CREATE TYPE order_status AS ENUM (
    'PENDING_PAYMENT',
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'PICKED_UP',
    'DELIVERED',
    'CANCELLED'
);

-- Enum for Payment Providers
CREATE TYPE payment_provider AS ENUM ('MTN_MOMO', 'HUBTEL');

-- Enum for Payment Status
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- Enum for Delivery Status
CREATE TYPE delivery_status AS ENUM ('ASSIGNED', 'PICKED_UP', 'DELIVERED');

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restaurants Table
CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    geo_lat DECIMAL(9,6) NOT NULL,
    geo_lng DECIMAL(9,6) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    rating_avg DECIMAL(2,1) DEFAULT 0.0,
    cuisine_type VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE menu_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    stock_level INTEGER DEFAULT 0,
    image_url VARCHAR(500)
);

-- Suppliers Table
CREATE TABLE suppliers (
    supplier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stock Imports Table
CREATE TABLE stock_imports (
    import_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(supplier_id),
    item_id UUID NOT NULL REFERENCES menu_items(item_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_at_import DECIMAL(10,2) NOT NULL,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(restaurant_id),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(user_id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(restaurant_id),
    rider_id UUID REFERENCES users(user_id),
    status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_address TEXT NOT NULL,
    geo_lat DECIMAL(9,6) NOT NULL,
    geo_lng DECIMAL(9,6) NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order Items Table
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES menu_items(item_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0.00
);

-- Payments Table
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    provider payment_provider NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    amount DECIMAL(10,2) NOT NULL,
    transaction_ref VARCHAR(255) UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Deliveries Table
CREATE TABLE deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    rider_id UUID NOT NULL REFERENCES users(user_id),
    status delivery_status NOT NULL DEFAULT 'ASSIGNED',
    picked_at TIMESTAMP WITH TIME ZONE,
    dropped_at TIMESTAMP WITH TIME ZONE,
    current_lat DECIMAL(9,6),
    current_lng DECIMAL(9,6)
);

-- Reviews Table
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    restaurant_id UUID NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
