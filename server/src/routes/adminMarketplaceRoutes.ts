import { Router } from 'express';
import {
  getAllMarketItems,
  createMarketItem,
  updateMarketItem,
  deleteMarketItem,
  toggleMarketItemStatus,
  getAllOrders,
  updateOrderStatus,
  getMarketplaceStats
} from '../controllers/adminMarketplaceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/items', getAllMarketItems);
router.post('/items', createMarketItem);
router.put('/items/:id', updateMarketItem);
router.delete('/items/:id', deleteMarketItem);
router.patch('/items/:id/toggle', toggleMarketItemStatus);

router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/stats', getMarketplaceStats);

export default router;
