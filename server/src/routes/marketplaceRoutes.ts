import { Router } from 'express';
import {
  getMarketItems,
  getMarketItem,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder,
  getMyOrders,
  getOrder
} from '../controllers/marketplaceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes - no authentication required
router.get('/items', getMarketItems);
router.get('/items/:id', getMarketItem);

// Protected routes - authentication required
router.get('/cart', authenticateToken, getCart);
router.post('/cart', authenticateToken, addToCart);
router.put('/cart/:id', authenticateToken, updateCartItem);
router.delete('/cart/:id', authenticateToken, removeFromCart);
router.delete('/cart', authenticateToken, clearCart);

router.post('/orders', authenticateToken, createOrder);
router.get('/orders', authenticateToken, getMyOrders);
router.get('/orders/:id', authenticateToken, getOrder);

export default router;
