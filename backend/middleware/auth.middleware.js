import { verifyAccessToken } from '../utils/jwt.js';

/**
 * JWT Authentication Middleware
 * Verifies the access token from Authorization header and attaches userId to request
 */
export function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header (Express lowercases headers)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    
    // Debug logging
    console.log('Auth Middleware - Headers:', {
      authorization: req.headers['authorization'],
      Authorization: req.headers['Authorization'],
      allHeaders: Object.keys(req.headers)
    });
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.error('Auth Middleware - No token found in Authorization header');
      return res.status(401).json({ 
        error: 'Access token required. Please provide Authorization header with Bearer token.' 
      });
    }
    
    console.log('Auth Middleware - Token found, verifying...');

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if token type is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        error: 'Invalid token type. Access token required.' 
      });
    }

    // Validate userId exists in token
    if (!decoded.userId) {
      return res.status(401).json({ 
        error: 'User ID not found in token. Invalid token.' 
      });
    }

    // Attach userId to request object
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token. Please provide a valid access token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please refresh your token.' 
      });
    }

    return res.status(401).json({ 
      error: 'Authentication failed. Please provide a valid access token.' 
    });
  }
}

