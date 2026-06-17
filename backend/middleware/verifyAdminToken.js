const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    );

    req.user = decoded;
    
    // Enforce store isolation for store_admin
    if (decoded.role === 'store_admin' && decoded.storeName) {
      req.storeName = decoded.storeName;
    }
    
    next();
  } catch (error) {
    console.error('[Token Verification Error]', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = verifyAdminToken;
