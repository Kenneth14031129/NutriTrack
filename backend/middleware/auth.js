const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is deactivated' });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      user: user
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        user: user
      };
    }

    next();
  } catch (error) {
    // Don't fail on optional auth - just continue without user
    next();
  }
};

module.exports = { auth, optionalAuth };