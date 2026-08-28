require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  authenticateToken,
  requireAdmin
} = require('./auth-middleware');
console.log(
  'Stripe key loaded:',
  process.env.STRIPE_SECRET_KEY ? 'YES' : 'NO'
);

const app = express();

app.use(
    '/products',
    express.static(path.join(__dirname, 'products'))
);

const PORT = 3000;

app.use(cors());
app.use('/api/stripe-webhook', express.raw({
  type: 'application/json'
}));
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

app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {

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

    cancel_url: 'http://localhost:4200/cart',

    customer_creation: 'always',

    metadata: {
      items: JSON.stringify(items)
    }

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

app.put('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {

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

app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {

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

app.post(
  '/api/stripe-webhook',
  (req, res) => {

    const signature = req.headers['stripe-signature'];

    let event;

    try {

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    } catch (error) {

      console.error(
        'WEBHOOK SIGNATURE ERROR:',
        error.message
      );

      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );

    }


    if (event.type === 'checkout.session.completed') {

  const session = event.data.object;

  console.log('PAYMENT COMPLETED:', session.id);


  const customerName =
    session.customer_details?.name || null;

  const customerEmail =
    session.customer_details?.email || null;

  const total =
    session.amount_total / 100;


  const items =
    JSON.parse(session.metadata.items);


  const createOrder = db.transaction(() => {

    const orderResult = db
      .prepare(`
        INSERT INTO orders
        (
          customer_name,
          customer_email,
          total,
          status,
          stripe_session_id
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        customerName,
        customerEmail,
        total,
        'paid',
        session.id
      );


    const orderId =
      orderResult.lastInsertRowid;


    const insertItem = db.prepare(`
      INSERT INTO order_items
      (
        order_id,
        product_id,
        product_name,
        price,
        quantity
      )
      VALUES (?, ?, ?, ?, ?)
    `);


    for (const item of items) {

      insertItem.run(
        orderId,
        item.id,
        item.name,
        item.price,
        item.quantity
      );

    }


    return orderId;

  });


  const orderId = createOrder();


  console.log(
    'ORDER CREATED:',
    orderId
  );

}


    res.json({
      received: true
    });

  }
);

app.get('/api/orders', authenticateToken, requireAdmin, (req, res) => {

  const orders = db
    .prepare(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `)
    .all();

  res.json(orders);

});

app.get('/api/orders/:id/items', authenticateToken, requireAdmin, (req, res) => {

  const orderId = Number(req.params.id);

  const items = db
    .prepare(`
      SELECT *
      FROM order_items
      WHERE order_id = ?
    `)
    .all(orderId);

  res.json(items);

});

app.put('/api/orders/:id/status', authenticateToken, requireAdmin, (req, res) => {

  const orderId = Number(req.params.id);

  const { status } = req.body;

  const allowedStatuses = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'completed',
    'cancelled'
  ];

  if (!allowedStatuses.includes(status)) {

    return res.status(400).json({
      message: 'Invalid order status'
    });

  }

  const order = db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .get(orderId);

  if (!order) {

    return res.status(404).json({
      message: 'Order not found'
    });

  }

  db
    .prepare(`
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `)
    .run(status, orderId);

  const updatedOrder = db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .get(orderId);

  res.json(updatedOrder);

});

app.post('/api/register', async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser = db
      .prepare(`
        SELECT *
        FROM users
        WHERE username = ?
      `)
      .get(username);

    if (existingUser) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db
      .prepare(`
        INSERT INTO users
        (username, password, role)
        VALUES (?, ?, ?)
      `)
      .run(
        username,
        hashedPassword,
        'admin'
      );

    const user = db
      .prepare(`
        SELECT id, username, role
        FROM users
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Registration successful',
      user
    });

  } catch (error) {

    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      message: 'Registration failed'
    });

  }

});

app.post('/api/login', async (req, res) => {

  try {

    const { username, password } = req.body;

    if (!username || !password) {

      return res.status(400).json({
        message: 'Username and password are required'
      });

    }


    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE username = ?
      `)
      .get(username);


    if (!user) {

      return res.status(401).json({
        message: 'Invalid username or password'
      });

    }


    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatches) {

      return res.status(401).json({
        message: 'Invalid username or password'
      });

    }


    const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '2h'
  }
);

res.json({
  message: 'Login successful',
  token,
  user: {
    id: user.id,
    username: user.username,
    role: user.role
  }
});

  } catch (error) {

    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      message: 'Login failed'
    });

  }

});

app.listen(PORT, () => {

  console.log(
    `Backend server running on http://localhost:${PORT}`
  );

});