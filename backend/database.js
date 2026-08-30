const Database = require('better-sqlite3');

const db = new Database('ecommerce.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT NOT NULL,
    image TEXT,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_email TEXT,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,

    FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
`);

const productCount = db
  .prepare('SELECT COUNT(*) AS count FROM products')
  .get();

if (productCount.count === 0) {

  const insertProduct = db.prepare(`
    INSERT INTO products
    (name, price, description, image, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  const products = [
    {
      name: 'Laptop',
      price: 899.99,
      description: 'Powerful laptop for work, study and gaming.',
      image: 'products/laptop.jpg',
      category: 'Electronics'
    },
    {
      name: 'Mechanical Keyboard',
      price: 79.99,
      description: 'Mechanical keyboard with RGB lighting.',
      image: 'products/keyboard.jpg',
      category: 'Accessories'
    },
    {
      name: 'Gaming Mouse',
      price: 39.99,
      description: 'Fast and precise gaming mouse.',
      image: 'products/mouse.jpg',
      category: 'Accessories'
    },
    {
      name: 'Gaming Headset',
      price: 59.99,
      description: 'Immersive gaming headset with clear sound.',
      image: 'products/headset.jpg',
      category: 'Accessories'
    },
    {
      name: 'Smartphone',
      price: 699.99,
      description: 'Modern smartphone with a high-quality display.',
      image: 'products/smartphone.jpg',
      category: 'Electronics'
    },
    {
      name: 'Monitor',
      price: 249.99,
      description: '27-inch monitor with excellent image quality.',
      image: 'products/monitor.jpg',
      category: 'Electronics'
    }
  ];

  const insertMany = db.transaction((products) => {
    for (const product of products) {
      insertProduct.run(
        product.name,
        product.price,
        product.description,
        product.image,
        product.category
      );
    }
  });

  insertMany(products);

  console.log('6 default products inserted.');
}

module.exports = db;