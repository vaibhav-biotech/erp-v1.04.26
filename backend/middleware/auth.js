const jwt = require('jsonwebtoken');

const verifyCustomerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    if (decoded.type !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type',
      });
    }

    req.customerId = decoded.customerId;
    req.userType = decoded.type;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = verifyCustomerAuth;
