import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import { requireWhitelistedIP, getWhitelistedIPs, getBlacklistedIPs, addToWhitelist, removeFromWhitelist, addToBlacklist, getClientIP } from '../middleware/ipMiddleware.js';

const router = Router();

// All routes require IP whitelist, authentication, and admin role
router.use(requireWhitelistedIP);
router.use(authenticateToken);
router.use(requireAdmin);

// Get all whitelisted IPs
router.get('/whitelist', async (req: Request, res: Response) => {
  try {
    const ips = await getWhitelistedIPs();
    res.json({ success: true, data: ips });
  } catch (error: any) {
    console.error('Error fetching whitelist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add IP to whitelist
router.post('/whitelist', async (req: Request, res: Response) => {
  try {
    const { ip_address, description } = req.body;
    const userId = (req as any).user?.userId;

    if (!ip_address) {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }

    const success = await addToWhitelist(ip_address, description || '', userId);

    if (success) {
      res.json({ success: true, message: 'IP added to whitelist' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to add IP to whitelist' });
    }
  } catch (error: any) {
    console.error('Error adding to whitelist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove IP from whitelist
router.delete('/whitelist/:ip', async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const success = await removeFromWhitelist(decodeURIComponent(ip));

    if (success) {
      res.json({ success: true, message: 'IP removed from whitelist' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to remove IP from whitelist' });
    }
  } catch (error: any) {
    console.error('Error removing from whitelist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all blacklisted IPs
router.get('/blacklist', async (req: Request, res: Response) => {
  try {
    const ips = await getBlacklistedIPs();
    res.json({ success: true, data: ips });
  } catch (error: any) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add IP to blacklist
router.post('/blacklist', async (req: Request, res: Response) => {
  try {
    const { ip_address, reason, blocked_until, is_permanent } = req.body;
    const userId = (req as any).user?.userId;

    if (!ip_address) {
      return res.status(400).json({ success: false, error: 'IP address is required' });
    }

    const blockedUntilDate = blocked_until ? new Date(blocked_until) : undefined;
    const success = await addToBlacklist(ip_address, reason || '', blockedUntilDate, is_permanent || false, userId);

    if (success) {
      res.json({ success: true, message: 'IP added to blacklist' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to add IP to blacklist' });
    }
  } catch (error: any) {
    console.error('Error adding to blacklist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current client IP (useful for self-whitelisting)
router.get('/my-ip', (req: Request, res: Response) => {
  const clientIP = getClientIP(req);
  res.json({ success: true, ip: clientIP });
});

export default router;
