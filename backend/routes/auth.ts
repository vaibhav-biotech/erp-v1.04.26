import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Customer from '../models/Customer';

const router = express.Router();

interface SignupRequestBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

// Generate JWT Token
const generateToken = (customerId: string): string => {
  return jwt.sign(
    { customerId, type: 'customer' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new customer
// @access  Public
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone }: SignupRequestBody = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new customer
    const newCustomer = new Customer({
      email,
      password,
      firstName,
      lastName,
      phone,
      isEmailVerified: false,
      preferences: {
        notifications: true,
        newsletter: true,
      },
    });

    await newCustomer.save();

    // Generate token
    const token = generateToken(newCustomer._id.toString());

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer: {
          _id: newCustomer._id,
          email: newCustomer.email,
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: newCustomer.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during signup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login customer and get JWT token
// @access  Public
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequestBody = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find customer and include password field
    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isPasswordCorrect = await customer.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(customer._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        customer: {
          _id: customer._id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout customer (frontend should delete token)
// @access  Private
router.post('/logout', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export default router;
