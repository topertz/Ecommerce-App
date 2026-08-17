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
  )
`);

module.exports = db;