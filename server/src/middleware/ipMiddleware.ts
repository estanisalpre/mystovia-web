import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';

/**
 * Get client IP address from request
 * Handles proxies (X-Forwarded-For, X-Real-IP) and direct connections
 */
export const getClientIP = (req: Request): string => {
  // Check for proxy headers first
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
    const ips = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor.split(',')[0];
    return ips.trim();
  }

  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP) {
    return Array.isArray(xRealIP) ? xRealIP[0] : xRealIP;
  }

  // Fallback to direct connection IP
  return req.socket.remoteAddress || req.ip || 'unknown';
};

/**
 * Normalize IP address (handle IPv6 mapped IPv4)
 */
const normalizeIP = (ip: string): string => {
  // Convert IPv6 mapped IPv4 (::ffff:192.168.1.1) to IPv4
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  // Handle localhost variants
  if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
};

/**
 * Check if IP is in whitelist
 */
export const isIPWhitelisted = async (ip: string): Promise<boolean> => {
  try {
    const normalizedIP = normalizeIP(ip);

    const [rows] = await db.query(
      'SELECT id FROM ip_whitelist WHERE ip_address = ? AND is_active = 1',
      [normalizedIP]
    ) as any[];

    return rows && rows.length > 0;
  } catch (error) {
    console.error('Error checking IP whitelist:', error);
    return false;
  }
};

/**
 * Check if IP is in blacklist
 */
export const isIPBlacklisted = async (ip: string): Promise<{ blocked: boolean; reason?: string }> => {
  try {
    const normalizedIP = normalizeIP(ip);

    const [rows] = await db.query(
      `SELECT id, reason, blocked_until, is_permanent
       FROM ip_blacklist
       WHERE ip_address = ? AND is_active = 1
       AND (is_permanent = 1 OR blocked_until > NOW() OR blocked_until IS NULL)`,
      [normalizedIP]
    ) as any[];

    if (rows && rows.length > 0) {
      return { blocked: true, reason: rows[0].reason || 'IP blocked' };
    }

    return { blocked: false };
  } catch (error) {
    console.error('Error checking IP blacklist:', error);
    return { blocked: false };
  }
};

/**
 * Log IP access attempt
 */
const logIPAccess = async (
  ip: string,
  accountId: number | null,
  endpoint: string,
  action: string,
  wasAllowed: boolean
): Promise<void> => {
  try {
    await db.query(
      'INSERT INTO ip_access_log (ip_address, account_id, endpoint, action, was_allowed) VALUES (?, ?, ?, ?, ?)',
      [normalizeIP(ip), accountId, endpoint, action, wasAllowed ? 1 : 0]
    );
  } catch (error) {
    console.error('Error logging IP access:', error);
  }
};

/**
 * Add IP to whitelist
 */
export const addToWhitelist = async (
  ip: string,
  description: string,
  createdBy?: number
): Promise<boolean> => {
  try {
    const normalizedIP = normalizeIP(ip);

    await db.query(
      `INSERT INTO ip_whitelist (ip_address, description, created_by)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_active = 1, description = VALUES(description)`,
      [normalizedIP, description, createdBy || null]
    );

    return true;
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    return false;
  }
};

/**
 * Remove IP from whitelist
 */
export const removeFromWhitelist = async (ip: string): Promise<boolean> => {
  try {
    const normalizedIP = normalizeIP(ip);

    await db.query(
      'UPDATE ip_whitelist SET is_active = 0 WHERE ip_address = ?',
      [normalizedIP]
    );

    return true;
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    return false;
  }
};

/**
 * Add IP to blacklist
 */
export const addToBlacklist = async (
  ip: string,
  reason: string,
  blockedUntil?: Date,
  isPermanent: boolean = false,
  createdBy?: number
): Promise<boolean> => {
  try {
    const normalizedIP = normalizeIP(ip);

    await db.query(
      `INSERT INTO ip_blacklist (ip_address, reason, blocked_until, is_permanent, created_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_active = 1,
         reason = VALUES(reason),
         blocked_until = VALUES(blocked_until),
         is_permanent = VALUES(is_permanent)`,
      [normalizedIP, reason, blockedUntil || null, isPermanent ? 1 : 0, createdBy || null]
    );

    return true;
  } catch (error) {
    console.error('Error adding IP to blacklist:', error);
    return false;
  }
};

/**
 * Middleware: Require IP to be whitelisted for admin access
 * Use this BEFORE authenticateToken for admin routes
 */
export const requireWhitelistedIP = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = getClientIP(req);
  const normalizedIP = normalizeIP(clientIP);
  const user = (req as any).user;
  const accountId = user?.userId || null;

  try {
    // Check if IP is whitelisted
    const isWhitelisted = await isIPWhitelisted(clientIP);

    if (!isWhitelisted) {
      // Log the blocked attempt
      await logIPAccess(normalizedIP, accountId, req.originalUrl, 'admin_access_denied', false);

      console.warn(`[IP BLOCKED] Admin access denied for IP: ${normalizedIP} - Path: ${req.originalUrl}`);

      // Return 403 with redirect info (frontend should handle redirect)
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_WHITELISTED',
        message: 'Your IP address is not authorized to access this resource.',
        redirect: '/'
      });
    }

    // Log successful access
    await logIPAccess(normalizedIP, accountId, req.originalUrl, 'admin_access_granted', true);

    // Add IP info to request for later use
    (req as any).clientIP = normalizedIP;

    next();
  } catch (error) {
    console.error('Error in IP whitelist middleware:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'IP_CHECK_ERROR'
    });
  }
};

/**
 * Middleware: Check blacklist for all requests
 * Use this globally or on specific routes
 */
export const checkBlacklist = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = getClientIP(req);

  try {
    const { blocked, reason } = await isIPBlacklisted(clientIP);

    if (blocked) {
      console.warn(`[IP BLACKLISTED] Request blocked for IP: ${clientIP} - Reason: ${reason}`);

      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_BLACKLISTED',
        message: reason || 'Your IP address has been blocked.'
      });
    }

    next();
  } catch (error) {
    console.error('Error in IP blacklist middleware:', error);
    // On error, allow request (fail open for blacklist)
    next();
  }
};

/**
 * Get all whitelisted IPs (for admin panel)
 */
export const getWhitelistedIPs = async (): Promise<any[]> => {
  try {
    const [rows] = await db.query(
      `SELECT w.*, a.name as created_by_name
       FROM ip_whitelist w
       LEFT JOIN accounts a ON w.created_by = a.id
       WHERE w.is_active = 1
       ORDER BY w.created_at DESC`
    ) as any[];

    return rows || [];
  } catch (error) {
    console.error('Error getting whitelisted IPs:', error);
    return [];
  }
};

/**
 * Get all blacklisted IPs (for admin panel)
 */
export const getBlacklistedIPs = async (): Promise<any[]> => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, a.name as created_by_name
       FROM ip_blacklist b
       LEFT JOIN accounts a ON b.created_by = a.id
       WHERE b.is_active = 1
       ORDER BY b.created_at DESC`
    ) as any[];

    return rows || [];
  } catch (error) {
    console.error('Error getting blacklisted IPs:', error);
    return [];
  }
};
