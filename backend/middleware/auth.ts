import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  customerId?: string;
  userType?: string;
}

export const verifyCustomerAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { customerId: string; type: string };

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
