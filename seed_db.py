import sqlite3
import os
import uuid
import shutil
import random
from datetime import datetime, timedelta

# TARGET: The exact files the Services are reading
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIRS = [
    'backend/services/auth-service',
    'backend/services/order-service',
    'backend/services/restaurant-service',
    'backend/services/delivery-service',
    'backend/services/payment-service',
    'backend/services/notification-service'
]

DB_NAME = "fda_local.db"
MASTER_DB = os.path.join(BASE_DIR, DB_NAME)

def seed():
    print(f"Creating Production-Grade Master Database: {MASTER_DB}")

    if os.path.exists(MASTER_DB):
        os.remove(MASTER_DB)

    conn = sqlite3.connect(MASTER_DB)
    cursor = conn.cursor()

    # 1. Schema Creation
    cursor.executescript('''
        CREATE TABLE users (
            user_id CHAR(36) PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(20) NOT NULL,
            password_hash TEXT NOT NULL,
            profile_picture_url VARCHAR(500),
            wallet_balance DECIMAL(10,2) DEFAULT 0.00,
            address TEXT,
            is_suspended NUMERIC(1,0) DEFAULT 0,
            onboarding_step INTEGER DEFAULT 1,
            verification_status VARCHAR(20) DEFAULT 'APPROVED',
            is_super_admin NUMERIC(1,0) DEFAULT 0,
            google_id VARCHAR(255),
            notification_preferences TEXT,
            preferred_language VARCHAR(10) DEFAULT 'en',
            profile_visibility NUMERIC(1,0) DEFAULT 1,
            vehicle_info VARCHAR(255),
            id_details VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE restaurants (
            restaurant_id CHAR(36) PRIMARY KEY,
            owner_id CHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            address TEXT NOT NULL,
            geo_lat DECIMAL(9,6) NOT NULL,
            geo_lng DECIMAL(9,6) NOT NULL,
            is_open BOOLEAN DEFAULT 1,
            is_online BOOLEAN DEFAULT 1,
            rating_avg DECIMAL(2,1) DEFAULT 0.0,
            cuisine_type VARCHAR(100),
            image_url VARCHAR(500),
            opening_hours VARCHAR(255),
            delivery_radius DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE menu_items (
            item_id CHAR(36) PRIMARY KEY,
            restaurant_id CHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            cost_price DECIMAL(10,2) DEFAULT 0.0,
            stock_level INTEGER DEFAULT 0,
            description TEXT,
            category VARCHAR(100),
            prep_time INTEGER,
            image_url VARCHAR(500),
            is_available BOOLEAN DEFAULT 1,
            is_featured BOOLEAN DEFAULT 0
        );
        CREATE TABLE orders (
            order_id CHAR(36) PRIMARY KEY,
            customer_id CHAR(36) NOT NULL,
            restaurant_id CHAR(36) NOT NULL,
            rider_id CHAR(36),
            status VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
            total_amount DECIMAL(10,2) NOT NULL,
            delivery_address TEXT NOT NULL,
            geo_lat DECIMAL(9,6) NOT NULL,
            geo_lng DECIMAL(9,6) NOT NULL,
            placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            delivered_at TIMESTAMP
        );
        CREATE TABLE order_items (
            order_item_id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL,
            item_id CHAR(36) NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            cost_price DECIMAL(10,2) DEFAULT 0.0
        );
        CREATE TABLE payments (
            payment_id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDING',
            amount DECIMAL(10,2) NOT NULL,
            transaction_ref VARCHAR(255) UNIQUE,
            paid_at TIMESTAMP
        );
        CREATE TABLE deliveries (
            delivery_id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL,
            rider_id CHAR(36),
            status VARCHAR(20) DEFAULT 'ASSIGNED',
            picked_at TIMESTAMP,
            dropped_at TIMESTAMP,
            current_lat DECIMAL(9,6),
            current_lng DECIMAL(9,6)
        );
        CREATE TABLE reviews (
            review_id CHAR(36) PRIMARY KEY,
            order_id CHAR(36) NOT NULL,
            restaurant_id CHAR(36) NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE audit_logs (
            log_id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE system_settings (
            key VARCHAR(50) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE transactions (
            transaction_id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            type VARCHAR(20) NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE subscriptions (
            subscription_id CHAR(36) PRIMARY KEY,
            restaurant_id CHAR(36) NOT NULL,
            plan_type VARCHAR(20) NOT NULL, -- WEEKLY, MONTHLY, ANNUAL
            status VARCHAR(20) DEFAULT 'ACTIVE',
            amount DECIMAL(10,2) NOT NULL,
            start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_date TIMESTAMP NOT NULL
        );
        CREATE TABLE restaurant_riders (
            id CHAR(36) PRIMARY KEY,
            restaurant_id CHAR(36) NOT NULL,
            rider_id CHAR(36) NOT NULL,
            status VARCHAR(20) DEFAULT 'ACTIVE',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE suppliers (
            supplier_id CHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(255),
            phone VARCHAR(20),
            email VARCHAR(255),
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE stock_imports (
            import_id CHAR(36) PRIMARY KEY,
            supplier_id CHAR(36) NOT NULL,
            item_id CHAR(36) NOT NULL,
            quantity INTEGER NOT NULL,
            cost_at_import DECIMAL(10,2) NOT NULL,
            import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE expenses (
            expense_id CHAR(36) PRIMARY KEY,
            restaurant_id CHAR(36) NOT NULL,
            category VARCHAR(100) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE promotions (
            promo_id CHAR(36) PRIMARY KEY,
            restaurant_id CHAR(36),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            discount_percentage DECIMAL(5,2),
            image_url VARCHAR(500),
            start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_date TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        );
        CREATE TABLE coupons (
            coupon_id CHAR(36) PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_amount DECIMAL(10,2),
            min_order_value DECIMAL(10,2),
            is_active BOOLEAN DEFAULT 1,
            expiry_date TIMESTAMP
        );
    ''')

    # 2. Data Generation
    # Verified Hash for 'password123'
    pw_hash = "$2b$12$qdNmv0ufVwYkf/1xl.OJ9.7KOda8PD72Y0d60B0ELn08OhrVEcXKm"

    # 2.1 Admin
    admin_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash) VALUES (?,?,?,?,?,?)",
                   (admin_id, "Platform Admin", "0000000000", "admin@example.com", "admin", pw_hash))

    # 2.1.1 Super Admin
    super_admin_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash, is_super_admin) VALUES (?,?,?,?,?,?,?)",
                   (super_admin_id, "Master Super Admin", "9999999999", "super@fda.com", "admin", pw_hash, 1))

    # 2.2 Riders (20)
    rider_ids = []
    for i in range(20):
        r_id = str(uuid.uuid4())
        rider_ids.append(r_id)
        cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash, vehicle_info, id_details, onboarding_step, verification_status) VALUES (?,?,?,?,?,?,?,?,?,?)",
                       (r_id, f"Rider {i+1}", f"02700000{i:02d}", f"rider{i+1}@example.com", "rider", pw_hash, "Honda Civic - GS-1234", "ID-99887766", 3, "APPROVED"))

    # 2.3 Customers (50)
    customer_ids = []
    for i in range(50):
        c_id = str(uuid.uuid4())
        customer_ids.append(c_id)
        cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash, wallet_balance, address) VALUES (?,?,?,?,?,?,?,?)",
                       (c_id, f"Customer {i+1}", f"05500000{i:02d}", f"customer{i+1}@example.com", "customer", pw_hash, 500.00, "Osu, Accra"))
    # Default test customer
    cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash, wallet_balance, address) VALUES (?,?,?,?,?,?,?,?)",
                   (str(uuid.uuid4()), "Main Customer", "0240000000", "customer@example.com", "customer", pw_hash, 1000.00, "Airport City, Accra"))

    # 2.4 Restaurants (10) & Menu Items (150)
    cuisines = ["Local", "Burgers", "Pizza", "Continental", "Healthy", "Sushi"]
    categories = ["Main Course", "Sides", "Drinks", "Desserts"]
    restaurant_ids = []

    for i in range(10):
        res_id = str(uuid.uuid4())
        restaurant_ids.append(res_id)
        vendor_id = str(uuid.uuid4())
        # Create a vendor user for each restaurant
        cursor.execute("INSERT INTO users (user_id, full_name, phone, email, role, password_hash, onboarding_step) VALUES (?,?,?,?,?,?,?)",
                       (vendor_id, f"Vendor {i+1}", f"02411111{i:02d}", f"vendor{i+1}@example.com", "vendor", pw_hash, 7))

        # Link default vendor@example.com to the first restaurant for easy testing
        v_email = f"vendor{i+1}@example.com"
        if i == 0: v_email = "vendor@example.com"
        cursor.execute("UPDATE users SET email=? WHERE user_id=?", (v_email, vendor_id))

        cursor.execute("INSERT INTO restaurants (restaurant_id, owner_id, name, address, geo_lat, geo_lng, cuisine_type, opening_hours, delivery_radius, is_online) VALUES (?,?,?,?,?,?,?,?,?,?)",
                       (res_id, vendor_id, f"Food Palace {i+1}", f"Street {i+1}, Accra", 5.60 + (i*0.01), -0.18 - (i*0.01), random.choice(cuisines), "08:00 - 22:00", 15.0, 1))

        # Add Subscription for each restaurant
        sub_id = str(uuid.uuid4())
        plan = random.choice(["WEEKLY", "MONTHLY", "ANNUAL"])
        amount = {"WEEKLY": 50, "MONTHLY": 180, "ANNUAL": 1800}[plan]
        end_date = (datetime.now() + timedelta(days={"WEEKLY": 7, "MONTHLY": 30, "ANNUAL": 365}[plan])).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("INSERT INTO subscriptions (subscription_id, restaurant_id, plan_type, status, amount, end_date) VALUES (?,?,?,?,?,?)",
                       (sub_id, res_id, plan, "ACTIVE", amount, end_date))

        # Assign 2 random riders to each restaurant
        assigned_riders = random.sample(rider_ids, 2)
        for r_id in assigned_riders:
            cursor.execute("INSERT INTO restaurant_riders (id, restaurant_id, rider_id) VALUES (?,?,?)",
                           (str(uuid.uuid4()), res_id, r_id))

        # 15 Menu items per restaurant
        for j in range(15):
            item_id = str(uuid.uuid4())
            price = random.randint(20, 150)
            cursor.execute("INSERT INTO menu_items (item_id, restaurant_id, name, price, cost_price, stock_level, description, category, prep_time, is_available, is_featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                           (item_id, res_id, f"Dish {j+1} from Rest {i+1}", price, price * 0.6, random.randint(10, 100), "A delicious sample meal.", random.choice(categories), random.randint(15, 45), 1, random.choice([0,1])))

    # 2.5 Orders (200)
    statuses = ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED", "COMPLETED", "CANCELLED"]
    for i in range(200):
        order_id = str(uuid.uuid4())
        cust_id = random.choice(customer_ids)
        rest_id = random.choice(restaurant_ids)
        status = random.choice(statuses)
        total = random.randint(50, 300)

        # Date logic: spread across last 30 days
        date = (datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))).strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("INSERT INTO orders (order_id, customer_id, restaurant_id, status, total_amount, delivery_address, geo_lat, geo_lng, placed_at) VALUES (?,?,?,?,?,?,?,?,?)",
                       (order_id, cust_id, rest_id, status, total, "Customer Home Address", 5.61, -0.17, date))

        # Assign a random rider if not placed/pending
        if status not in ["PENDING_PAYMENT", "PLACED", "CANCELLED"]:
            cursor.execute("UPDATE orders SET rider_id=? WHERE order_id=?", (random.choice(rider_ids), order_id))

        # Create a payment for each order
        cursor.execute("INSERT INTO payments (payment_id, order_id, provider, status, amount, transaction_ref, paid_at) VALUES (?,?,?,?,?,?,?)",
                       (str(uuid.uuid4()), order_id, "MTN_MOMO", "SUCCESS" if status != "CANCELLED" else "FAILED", total, f"TXN_{uuid.uuid4().hex[:12]}", date))

    # 2.6 System Settings
    cursor.execute("INSERT INTO system_settings (key, value) VALUES (?,?)", ("commission_rate", "10"))
    cursor.execute("INSERT INTO system_settings (key, value) VALUES (?,?)", ("platform_name", "fDA Delivery"))

    # 2.7 Sample Promotions
    cursor.execute("INSERT INTO promotions (promo_id, title, description, discount_percentage, image_url) VALUES (?,?,?,?,?)",
                   (str(uuid.uuid4()), "Welcome Offer", "Get 20% off your first order with WorldPlate!", 20.0, "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000"))
    cursor.execute("INSERT INTO promotions (promo_id, title, description, discount_percentage, image_url) VALUES (?,?,?,?,?)",
                   (str(uuid.uuid4()), "Weekend Feast", "Enjoy massive discounts every Saturday and Sunday.", 15.0, "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000"))

    conn.commit()
    conn.close()

    # 3. Synchronize to all microservices
    for sub in SERVICE_DIRS:
        full_path = os.path.join(BASE_DIR, sub)
        if os.path.exists(full_path):
            shutil.copy2(MASTER_DB, os.path.join(full_path, DB_NAME))
            print(f"Synced to {sub}")

    print("\nSUCCESS! End-to-End environment seeded.")

if __name__ == "__main__":
    seed()
