require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Category = require('./models/Category');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const customersRouter = require('./routes/customers');

const app = express();


// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware (memory storage so we can forward buffer to S3)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint used by frontend AddProduct form to upload images to S3
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const { uploadImageToS3 } = require('./services/s3.service');
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname || `upload-${Date.now()}`;
    const contentType = req.file.mimetype || 'image/jpeg';

    const result = await uploadImageToS3(fileBuffer, originalName, contentType);
    if (!result.success) return res.status(500).json({ success: false, error: result.error });

    return res.status(200).json({ success: true, url: result.url });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Upload failed' });
  }
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-db';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠ MongoDB connection failed:', error.message);
    console.warn('⚠ Continuing without database...');
  }
};

// Connect to database
connectDB();

// Basic Routes
app.get('/', (req, res) => {
  res.json({ message: 'ERP Server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    success: true,
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Category Routes
// GET all categories with subcategories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET single category by slug
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST create new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name, slug, description, icon, subcategories } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const category = new Category({
      name,
      slug,
      description,
      icon,
      subcategories: subcategories || [],
    });

    await category.save();
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, slug, description, icon, subcategories } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        slug,
        description,
        icon,
        subcategories,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// PATCH reorder categories
app.patch('/api/categories/reorder', async (req, res) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories array is required' });
    }

    // Update displayOrder for each category
    const updatePromises = categories.map((cat, index) =>
      Category.findByIdAndUpdate(
        cat._id,
        { displayOrder: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Categories reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Products Router
app.use('/api/products', productsRouter);

// Customer Auth Router
app.use('/api/auth', authRouter);

// Customers Router
app.use('/api/customers', customersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server startup
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  ERP Server Running                    ║
║  Port: ${PORT}                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                ║
║  Database: ${process.env.MONGODB_URI ? 'Connected' : 'Local'}              ║
╚════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });

});


