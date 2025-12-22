import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken'; // JWT COMENTADO - No se usa por ahora
import db from '../config/database.js';

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/**
 * Authenticate user using HttpOnly cookie or Authorization header
 * Supports both cookie-based auth (preferred) and Bearer token for backwards compatibility
 *
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
*/

/**
 * Authenticate user using simple cookie-based session (without JWT)
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.cookies?.userId;

    // Debug logging for production issues
    if (process.env.NODE_ENV === 'production') {
      console.log('[Auth Debug] Cookies received:', Object.keys(req.cookies || {}));
      console.log('[Auth Debug] UserId cookie:', userId ? 'present' : 'missing');
      console.log('[Auth Debug] Origin:', req.headers.origin);
    }

    if (!userId) {
      return res.status(401).json({
        error: 'No autenticado',
        code: 'NO_AUTH'
      });
    }

    // Verificar que el usuario existe en la base de datos
    const [users] = await db.query(
      'SELECT id, email, name, group_id FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!users || users.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = users[0];
    (req as any).user = {
      userId: user.id,
      email: user.email,
      accountName: user.name,
      groupId: user.group_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/**
 * Optional authentication - attaches user if token exists but doesn't require it
 * Useful for endpoints that work for both authenticated and non-authenticated users
 *
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
*/

/**
 * Optional authentication - attaches user if cookie exists but doesn't require it (without JWT)
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const userId = req.cookies?.userId;

    if (!userId) {
      return next();
    }

    // Verificar que el usuario existe en la base de datos
    const [users] = await db.query(
      'SELECT id, email, name, group_id FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (users && users.length > 0) {
      const user = users[0];
      (req as any).user = {
        userId: user.id,
        email: user.email,
        accountName: user.name,
        groupId: user.group_id
      };
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};
