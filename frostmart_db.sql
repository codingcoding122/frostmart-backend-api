CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products (name, price, stock, description)
VALUES 
('Frozen Nugget', 50000, 100, 'Nugget ayam beku'),
('Sosis Ayam', 30000, 50, 'Sosis siap goreng'),
('Dimsum Ayam', 40000, 80, 'Dimsum isi ayam');

SELECT * FROM products;

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (user_id, total_price, status)
VALUES (2, 50000, 'pending');

SELECT * FROM orders;

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
);

INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES (1, 1, 1, 50000);

SELECT * FROM order_items;

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (order_id, payment_method, payment_status)
VALUES (1, 'cash', 'paid');

SELECT * FROM transactions;

CREATE TABLE inventory_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    change_type VARCHAR(10),
    quantity INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inventory_log (product_id, change_type, quantity, description)
VALUES (1, 'OUT', 1, 'Penjualan oleh user id 2');

SELECT * FROM inventory_log;

UPDATE products
SET stock = stock - 1
WHERE id = 1;

SELECT * FROM products
ORDER BY id ASC;