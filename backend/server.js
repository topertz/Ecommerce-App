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

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

app.use(cors({ origin: FRONTEND_URL }));
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

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const cleanImage = typeof image === 'string' ? image.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';
  const numericPrice = Number(price);

  if (!cleanName) {
    return res.status(400).json({
      message: 'Product name is required'
    });
  }

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({
      message: 'Price must be greater than 0'
    });
  }

  if (!cleanDescription) {
    return res.status(400).json({
      message: 'Product description is required'
    });
  }

  if (!cleanCategory) {
    return res.status(400).json({
      message: 'Product category is required'
    });
  }

  const result = db
    .prepare(`
      INSERT INTO products
      (name, price, description, image, category)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      cleanName,
      numericPrice,
      cleanDescription,
      cleanImage,
      cleanCategory
    );

  const newProduct = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(newProduct);

});

app.post('/api/create-checkout-session', async (req, res) => {

  try {

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Cart cannot be empty'
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        message: 'Too many items'
      });
    }

    const productIds = items.map(item => Number(item.id));

    if (productIds.some(id => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({
        message: 'Invalid product ID'
      });
    }

    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length !== productIds.length) {
      return res.status(400).json({
        message: 'Duplicate products are not allowed'
      });
    }

    const products = db
      .prepare(`
        SELECT id, name, price, description, image, category
        FROM products
        WHERE id IN (${uniqueProductIds.map(() => '?').join(',')})
      `)
      .all(...uniqueProductIds);

    if (products.length !== uniqueProductIds.length) {
      return res.status(400).json({
        message: 'One or more products no longer exist'
      });
    }

    const productMap = new Map(products.map(product => [product.id, product]));

    const validatedItems = [];

    for (const item of items) {
      const product = productMap.get(Number(item.id));

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({
          message: 'Invalid product quantity'
        });
      }

      validatedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }

    const lineItems = validatedItems.map(item => ({
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

    success_url: `${FRONTEND_URL}/success`,
    cancel_url: `${FRONTEND_URL}/cart`,

    customer_creation: 'always',

    metadata: {
      items: JSON.stringify(validatedItems.map(item => ({
          id: item.id,
          quantity: item.quantity
        }))
      )
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

  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const cleanImage = typeof image === 'string' ? image.trim() : '';
  const cleanCategory = typeof category === 'string' ? category.trim() : '';
  const numericPrice = Number(price);

  if (!cleanName) {
    return res.status(400).json({
      message: 'Product name is required'
    });
  }

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({
      message: 'Price must be greater than 0'
    });
  }

  if (!cleanDescription) {
    return res.status(400).json({
      message: 'Product description is required'
    });
  }

  if (!cleanCategory) {
    return res.status(400).json({
      message: 'Product category is required'
    });
  }

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
    cleanName,
    numericPrice,
    cleanDescription,
    cleanImage,
    cleanCategory,
    id
  );

  const updatedProduct = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(id);

  res.json(updatedProduct);

});

// DELETE ALL products

app.delete('/api/products', authenticateToken, requireAdmin, (req, res) => {
  const result = db
  .prepare('DELETE FROM products')
  .run();

  res.json({
    message: 'All products deleted successfully',
    deletedCount: result.changes
  });
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

  const existingOrder = db
    .prepare(
      'SELECT id FROM orders WHERE stripe_session_id = ?'
    )
    .get(session.id);

    if (existingOrder) {
      return res.json({
        received: true
      });
    }

    let items;
    try {
      items = JSON.parse(session.metadata?.items || '[]');
    } catch {
      return res.status(400).json({
        message: 'Invalid order metadata'
      });
    }

    if (!Array.isArray(items) || items.length === 0 || items.some(item => 
      !Number.isInteger(Number(item.id)) || Number(item.id) <= 0 || !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) < 1 || Number(item.quantity) > 99)) {
        return res.status(400).json({
          message: 'Invalid order items'
        });
    }

    const productIds = items.map(item => Number(item.id));

    const products = db
     .prepare(`
      SELECT id, name, price
      FROM products
      WHERE id IN (${productIds.map(() => '?').join(',')})
      `)  
      .all(...productIds);

    const productMap = new Map(products.map(product => [product.id, product]));

    if (products.length !== productIds.length) {
      return res.status(400).json({
        message: 'One or more products were not found'
      });
    }

  console.log('PAYMENT COMPLETED:', session.id);


  const customerName =
    session.customer_details?.name || null;

  const customerEmail =
    session.customer_details?.email || null;

  const total =
    session.amount_total / 100;

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

      const product = productMap.get(Number(item.id));

      insertItem.run(
        orderId,
        product.id,
        product.name,
        product.price,
        Number(item.quantity)
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

    const username = typeof req.body.username === 'string' ? req.body.username.trim(): '';
    const password = typeof req.body.password === 'string' ? req.body.password: '';

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        message: 'Username must be between 3 and 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return res.status(400).json({
        message: 'Username contains invalid characters'
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: 'Password must be between 8 and 128 characters'
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db
      .prepare(`
        INSERT INTO users
        (username, password, role)
        VALUES (?, ?, ?)
      `)
      .run(
        username,
        hashedPassword,
        'user'
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

    const username = typeof req.body.username === 'string' ? req.body.username.trim(): '';

    const password = typeof req.body.password === 'string' ? req.body.password: '';

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

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured.');

      return res.status(500).json({
        message: 'Server authentication is not configured'
      });
    }

    const token = jwt.sign(
  {
    id: user.id,
    username: user.username
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '2h',
    algorithm: 'HS256'
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

app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.listen(PORT, () => {

  console.log(
    `Backend server running on http://localhost:${PORT}`
  );

});