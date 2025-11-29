import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';

/**
 * Middleware to check if the authenticated user is an admin
 * Must be used AFTER authenticateToken middleware
 *
 * Admin is determined by group_id >= 3 in the accounts table
 * group_id 1 = normal user
 * group_id 2 = tutor (optional)
 * group_id 3+ = gamemaster/admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    console.log("🔍 requireAdmin => user del token:", user);

    if (!user || !user.userId) {
      console.log("🚫 No hay usuario en token o falta userId");
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Query the user's group_id from database
    const [rows] = await db.query(
      'SELECT group_id FROM accounts WHERE id = ?',
      [user.userId]
    ) as any[];

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: 'Account not found'
      });
    }

    const groupId = Number(rows[0].group_id);

    // Check if user is admin (group_id >= 3)
    if (isNaN(groupId) || groupId < 10) {
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.',
        required_group: 10,
        current_group: groupId
      });
    }

    // Attach admin info to request
    (req as any).isAdmin = true;
    (req as any).groupId = groupId;

    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * Optional middleware to check admin status without blocking
 * Adds isAdmin and groupId to request but doesn't block non-admins
 */
export const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user || !user.userId) {
      (req as any).isAdmin = false;
      (req as any).groupId = 1;
      return next();
    }

    const [rows] = await db.query(
      'SELECT group_id FROM accounts WHERE id = ?',
      [user.userId]
    ) as any[];

    if (rows && rows.length > 0) {
      const groupId = rows[0].group_id;
      (req as any).isAdmin = groupId >= 3;
      (req as any).groupId = groupId;
    } else {
      (req as any).isAdmin = false;
      (req as any).groupId = 1;
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    (req as any).isAdmin = false;
    (req as any).groupId = 1;
    next();
  }
};
