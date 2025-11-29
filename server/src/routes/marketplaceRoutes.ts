import { Router } from 'express';
import {
  getMarketItems,
  getMarketItem,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createCheckout,
  createOrder,
  getMyOrders,
  getOrder,
  handleMercadoPagoWebhook,
  processCardPayment
} from '../controllers/marketplaceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes - no authentication required
router.get('/items', getMarketItems);
router.get('/items/:id', getMarketItem);

// MercadoPago webhook - no authentication (MercadoPago calls this)
router.post('/mp/webhook', handleMercadoPagoWebhook);

// Protected routes - authentication required
router.get('/cart', authenticateToken, getCart);
router.post('/cart', authenticateToken, addToCart);
router.put('/cart/:id', authenticateToken, updateCartItem);
router.delete('/cart/:id', authenticateToken, removeFromCart);
router.delete('/cart', authenticateToken, clearCart);

// New checkout endpoint with MercadoPago
router.post('/checkout', authenticateToken, createCheckout);

// Process payment with card token (Checkout API)
router.post('/process-payment', authenticateToken, processCardPayment);

// DEVELOPMENT ONLY: Simulate payment approval for testing
if (process.env.NODE_ENV === 'development') {
  router.post('/test/approve-payment/:orderId', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    const userId = (req as any).user.userId;

    try {
      const db = (await import('../config/database.js')).default;
      const connection = await db.getConnection();

      // Verify order belongs to user
      const [orders] = await connection.query(
        'SELECT * FROM orders WHERE id = ? AND account_id = ?',
        [orderId, userId]
      ) as any[];

      if (!orders || orders.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Order not found' });
      }

      await connection.beginTransaction();

      // Update order status to approved
      await connection.query(
        'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
        ['approved', `TEST_${Date.now()}`, orderId]
      );

      // Get order items and update stock
      const [orderItems] = await connection.query(
        'SELECT market_item_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      ) as any[];

      for (const item of orderItems) {
        await connection.query(
          'UPDATE market_items SET stock = stock - ? WHERE id = ? AND stock != -1',
          [item.quantity, item.market_item_id]
        );
      }

      // Clear user's cart
      await connection.query(
        'DELETE FROM cart_items WHERE account_id = ?',
        [userId]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Payment simulated successfully',
        redirect: `${process.env.FRONTEND_URL}/marketplace?payment=success`
      });
    } catch (error: any) {
      console.error('Error simulating payment:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Legacy order endpoint (deprecated)
router.post('/orders', authenticateToken, createOrder);
router.get('/orders', authenticateToken, getMyOrders);
router.get('/orders/:id', authenticateToken, getOrder);

export default router;
