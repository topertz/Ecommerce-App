const db = require('./database');
const products = require('./products');

const insert = db.prepare(`
  INSERT INTO products
  (id, name, price, description, image, category)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((products) => {

  for (const product of products) {

    insert.run(
      product.id,
      product.name,
      product.price,
      product.description,
      product.image,
      product.category
    );

  }

});

const existingProducts = db
  .prepare('SELECT COUNT(*) AS count FROM products')
  .get();

if (existingProducts.count === 0) {

  insertMany(products);

  console.log(`${products.length} products inserted into database.`);

} else {

  console.log('Products already exist in database.');

}