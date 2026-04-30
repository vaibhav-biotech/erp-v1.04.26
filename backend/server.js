require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Category = require('./models/Category');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const customersRouter = require('./routes/customers');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const landingRouter = require('./routes/landing');
const storeRouter = require('./middleware/storeRouter'); // NEW: Store detection middleware
const verifyAdminToken = require('./middleware/verifyAdminToken');

const app = express();


// Middleware
const isCorsOpenMode = String(process.env.CORS_DYNAMIC_OPEN || '').toLowerCase() === 'true';

const allowedExactOrigins = [
  'https://erp-v1-04-26-cwfl.vercel.app',
  'https://plantingarden.vercel.app',
  'https://www.plantingarden.com',
  'https://plantingarden.com',
  'http://www.plantingarden.com',
  'http://plantingarden.com',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : []),
].filter(Boolean);

const allowedOriginPatterns = [
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^http:\/\/\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/,
  /^https?:\/\/.*\.exp\.direct$/,
  /^exp:\/\/.+$/,
  /^capacitor:\/\/localhost$/,
  /^ionic:\/\/localhost$/,
  /^https:\/\/erp-v1-04-26.*\.vercel\.app$/,
  /^https:\/\/plantingarden.*\.vercel\.app$/,
  ...(process.env.CORS_ORIGIN_REGEX
    ? process.env.CORS_ORIGIN_REGEX
        .split(',')
        .map((pattern) => pattern.trim())
        .filter(Boolean)
        .map((pattern) => {
          try {
            return new RegExp(pattern);
          } catch (error) {
            console.warn(`[CORS] Invalid regex in CORS_ORIGIN_REGEX: ${pattern}`);
            return null;
          }
        })
        .filter(Boolean)
    : []),
];

const isOriginAllowed = (origin) => {
  if (isCorsOpenMode) return true;
  if (origin === 'null') return true;
  return allowedExactOrigins.includes(origin) || allowedOriginPatterns.some((pattern) => pattern.test(origin));
};

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`[CORS] Request from: ${origin || 'NO ORIGIN (curl/mobile)'}`);

    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      console.log(`[CORS] ✓ Allowed: ${origin}`);
      return callback(null, true);
    }

    console.warn(`[CORS] ✗ Blocked: ${origin}`);
    console.warn(`[CORS] Allowed exact: ${allowedExactOrigins.join(' | ')}`);
    // Do not throw hard errors for unknown origins.
    // Browsers will still block due to missing CORS headers,
    // while native/mobile clients can continue to work.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Name', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'Content-Length'],
  maxAge: 3600
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// STEP 1: Store Router Middleware (Option C Implementation)
// Purpose: Detect which store is accessing and set req.storeName
// Runs on ALL routes before other handlers
app.use(storeRouter);

// Pre-flight handler for all routes - use RegExp instead of '*' for Express 5
app.options(/.*/, cors(corsOptions));

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
    const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
      ? req.body.folder.trim()
      : 'products';

    const result = await uploadImageToS3(fileBuffer, originalName, contentType, folder);
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

// Notification Bar Routes
const getNotificationCollection = () => mongoose.connection.db.collection('notification_bars');

const toObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
};

const sanitizeHexColor = (value, fallback) => {
  const next = String(value || '').trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(next) ? next : fallback;
};

const sanitizeFontWeight = (value) => (String(value || '').toLowerCase() === 'bold' ? 'bold' : 'regular');

const defaultNotificationConfig = {
  message: '🌿 Free shipping on orders above ₹499',
  bgColor: '#fef08a',
  textColor: '#713f12',
  fontWeight: 'regular',
  isActive: true,
};

app.get('/api/notification-bar', async (req, res) => {
  try {
    const storeName = req.storeName || 'plantsingarden';

    const activeDocs = await getNotificationCollection()
      .find({ storeName, isActive: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const fallbackDoc = activeDocs[0] || await getNotificationCollection().findOne(
      { storeName },
      { sort: { updatedAt: -1, createdAt: -1 } }
    );

    const notifications = activeDocs.map((doc) => ({
      _id: doc._id,
      message: doc.message || defaultNotificationConfig.message,
      bgColor: doc.bgColor || defaultNotificationConfig.bgColor,
      textColor: doc.textColor || defaultNotificationConfig.textColor,
      fontWeight: sanitizeFontWeight(doc.fontWeight),
      isActive: true,
    }));

    return res.status(200).json({
      success: true,
      data: fallbackDoc
        ? {
            _id: fallbackDoc._id,
            message: fallbackDoc.message || defaultNotificationConfig.message,
            bgColor: fallbackDoc.bgColor || defaultNotificationConfig.bgColor,
            textColor: fallbackDoc.textColor || defaultNotificationConfig.textColor,
            fontWeight: sanitizeFontWeight(fallbackDoc.fontWeight),
            isActive: fallbackDoc.isActive !== false,
          }
        : defaultNotificationConfig,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching notification bar:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notification bar' });
  }
});

app.get('/api/notification-bar/admin', verifyAdminToken, async (req, res) => {
  try {
    const storeName = req.storeName || 'plantsingarden';

    const docs = await getNotificationCollection()
      .find({ storeName })
      .sort({ createdAt: -1 })
      .toArray();

    const data = docs.map((doc) => ({
      _id: doc._id,
      message: doc.message || defaultNotificationConfig.message,
      bgColor: doc.bgColor || defaultNotificationConfig.bgColor,
      textColor: doc.textColor || defaultNotificationConfig.textColor,
      fontWeight: sanitizeFontWeight(doc.fontWeight),
      isActive: Boolean(doc.isActive),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error listing notification bars:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notification bars' });
  }
});

app.post('/api/notification-bar/admin', verifyAdminToken, async (req, res) => {
  try {
    const storeName = req.storeName || 'plantsingarden';
    const { message, bgColor, textColor, fontWeight, isActive } = req.body || {};

    const safeMessage = String(message || '').trim();
    if (!safeMessage) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const safeBgColor = sanitizeHexColor(bgColor, defaultNotificationConfig.bgColor);
    const safeTextColor = sanitizeHexColor(textColor, defaultNotificationConfig.textColor);
    const safeFontWeight = sanitizeFontWeight(fontWeight);
    const shouldActivate = typeof isActive === 'boolean' ? isActive : true;

    const now = new Date();

    const doc = {
      storeName,
      message: safeMessage,
      bgColor: safeBgColor,
      textColor: safeTextColor,
      fontWeight: safeFontWeight,
      isActive: shouldActivate,
      createdAt: now,
      updatedAt: now,
    };

    const result = await getNotificationCollection().insertOne(doc);

    return res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...doc,
      },
    });
  } catch (error) {
    console.error('Error creating notification bar:', error);
    return res.status(500).json({ success: false, error: 'Failed to create notification bar' });
  }
});

app.patch('/api/notification-bar/admin/:id', verifyAdminToken, async (req, res) => {
  try {
    const storeName = req.storeName || 'plantsingarden';
    const objectId = toObjectId(req.params.id);

    if (!objectId) {
      return res.status(400).json({ success: false, error: 'Invalid notification id' });
    }

    const existing = await getNotificationCollection().findOne({ _id: objectId, storeName });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const now = new Date();
    const patch = {
      updatedAt: now,
    };

    if (req.body?.message !== undefined) {
      const safeMessage = String(req.body.message || '').trim();
      if (!safeMessage) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }
      patch.message = safeMessage;
    }

    if (req.body?.bgColor !== undefined) {
      patch.bgColor = sanitizeHexColor(req.body.bgColor, existing.bgColor || defaultNotificationConfig.bgColor);
    }

    if (req.body?.textColor !== undefined) {
      patch.textColor = sanitizeHexColor(req.body.textColor, existing.textColor || defaultNotificationConfig.textColor);
    }

    if (req.body?.fontWeight !== undefined) {
      patch.fontWeight = sanitizeFontWeight(req.body.fontWeight);
    }

    if (req.body?.isActive !== undefined) {
      const shouldActivate = Boolean(req.body.isActive);
      patch.isActive = shouldActivate;
    }

    await getNotificationCollection().updateOne(
      { _id: objectId, storeName },
      { $set: patch }
    );

    const updated = await getNotificationCollection().findOne({ _id: objectId, storeName });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error saving notification bar:', error);
    return res.status(500).json({ success: false, error: 'Failed to update notification bar' });
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

// Admin Auth Router
app.use('/api/admin', adminRouter);

// Customers Router
app.use('/api/customers', customersRouter);

// Orders Router
app.use('/api/orders', ordersRouter);

// Landing Page Router (hero banners)
app.use('/api/landing', landingRouter);

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


