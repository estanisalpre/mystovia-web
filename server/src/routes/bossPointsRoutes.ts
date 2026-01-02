import { Router } from 'express';
import {
  getBossPoints,
  getShopItems,
  purchaseItem,
  getPurchaseHistory,
  getKillHistory,
  getCharacters
} from '../controllers/bossPointsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public route - get shop items
router.get('/shop', getShopItems);

// Protected routes
router.get('/balance', authenticateToken, getBossPoints);
router.get('/characters', authenticateToken, getCharacters);
router.post('/purchase', authenticateToken, purchaseItem);
router.get('/purchases', authenticateToken, getPurchaseHistory);
router.get('/kills', authenticateToken, getKillHistory);

export default router;
