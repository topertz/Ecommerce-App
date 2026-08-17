require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
console.log(
  'Stripe key loaded:',
  process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO'
);

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET all products

app.get('/api/products', (req, res) => {

  const products = db
    .prepare('SELECT * FROM products')
    .all();

  res.json(products);

});


// GET product by ID

app.get('/api/products/:id', (req, res) => {

  const id = Number(req.params.id);

  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(id);

  if (!product) {

    return res.status(404).json({
      message: 'Product not found'
    });

  }

  res.json(product);

});


// POST new product

app.post('/api/products', (req, res) => {

  const {
    name,
    price,
    description,
    image,
    category
  } = req.body;

  const result = db
    .prepare(`
      INSERT INTO products
      (name, price, description, image, category)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      name,
      price,
      description,
      image,
      category
    );

  const newProduct = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(newProduct);

});

app.post('/api/create-checkout-session', async (req, res) => {

  try {

    const { items } = req.body;

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',

        product_data: {
          name: item.name
        },

        unit_amount: Math.round(item.price * 100)
      },

      quantity: item.quantity
    }));


    const session = await stripe.checkout.sessions.create({

      payment_method_types: ['card'],

      line_items: lineItems,

      mode: 'payment',

      success_url: 'http://localhost:4200/success',

      cancel_url: 'http://localhost:4200/cart'

    });


    res.json({
      url: session.url
    });

  } catch (error) {

    console.error('STRIPE ERROR:', error);

    res.status(500).json({
      message: 'Failed to create checkout session'
    });

  }

});

app.put('/api/products/:id', (req, res) => {

  const id = Number(req.params.id);

  const {
    name,
    price,
    description,
    image,
    category
  } = req.body;

  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(id);

  if (!product) {

    return res.status(404).json({
      message: 'Product not found'
    });

  }

  db.prepare(`
    UPDATE products
    SET
      name = ?,
      price = ?,
      description = ?,
      image = ?,
      category = ?
    WHERE id = ?
  `).run(
    name,
    price,
    description,
    image,
    category,
    id
  );

  const updatedProduct = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(id);

  res.json(updatedProduct);

});

// DELETE product

app.delete('/api/products/:id', (req, res) => {

  const id = Number(req.params.id);

  const product = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(id);

  if (!product) {

    return res.status(404).json({
      message: 'Product not found'
    });

  }

  db
    .prepare('DELETE FROM products WHERE id = ?')
    .run(id);

  res.json({
    message: 'Product deleted successfully',
    product
  });

});


app.listen(PORT, () => {

  console.log(
    `Backend server running on http://localhost:${PORT}`
  );

});