import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Authenticate user using HttpOnly cookie or Authorization header
 * Supports both cookie-based auth (preferred) and Bearer token for backwards compatibility
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from cookie first (more secure)
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header for API clients (backwards compatibility)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      // Check if token expired
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(403).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    (req as any).user = user;
    next();
  });
};

/**
 * Optional authentication - attaches user if token exists but doesn't require it
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (!err) {
      (req as any).user = user;
    }
    next();
  });
};
