const express = require('express');
const cors = require('cors');

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

const products = [
  {
    id: 1,
    name: 'Laptop',
    price: 899.99,
    description: 'Powerful laptop for work, study and gaming.',
    image: 'products/laptop.jpg',
    category: 'Electronics'
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    price: 79.99,
    description: 'Mechanical keyboard with RGB lighting.',
    image: 'products/keyboard.jpg',
    category: 'Accessories'
  },
  {
    id: 3,
    name: 'Gaming Mouse',
    price: 39.99,
    description: 'Fast and precise gaming mouse.',
    image: 'products/mouse.jpg',
    category: 'Accessories'
  },
  {
    id: 4,
    name: 'Gaming Headset',
    price: 59.99,
    description: 'Immersive gaming headset with clear sound.',
    image: 'products/headset.jpg',
    category: 'Accessories'
  },
  {
    id: 5,
    name: 'Smartphone',
    price: 699.99,
    description: 'Modern smartphone with a high-quality display.',
    image: 'products/smartphone.jpg',
    category: 'Electronics'
  },
  {
    id: 6,
    name: 'Monitor',
    price: 249.99,
    description: '27-inch monitor with excellent image quality.',
    image: 'products/monitor.jpg',
    category: 'Electronics'
  }
];

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {

  const id = Number(req.params.id);

  const product = products.find(
    product => product.id === id
  );

  if (!product) {
    return res.status(404).json({
      message: 'Product not found'
    });
  }

  res.json(product);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});