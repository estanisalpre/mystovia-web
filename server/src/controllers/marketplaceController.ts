import { Request, Response } from 'express';
import db from '../config/database.js';
import {
  MarketItem,
  CartItem,
  AddToCartRequest,
  CreateOrderRequest,
  CartWithItems,
  OrderWithDetails
} from '../types/index.js';
import {
  createSingleProductPreference,
  getPaymentById,
  WebhookPayload,
  createCardPayment
} from '../lib/mercadopago.js';
import { deliverItemsToInbox, deliverItemsToDepot } from '../services/itemDeliveryService.js';

/**
 * Get all active market items
 * Public endpoint - no authentication required
 */
export const getMarketItems = async (req: Request, res: Response) => {
  try {
    const { category, featured } = req.query;

    let query = 'SELECT * FROM market_items WHERE is_active = 1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured === 'true') {
      query += ' AND featured = 1';
    }

    // Filter items with available stock
    query += ' AND (stock = -1 OR stock > 0)';
    query += ' ORDER BY featured DESC, created_at DESC';

    const [items] = await db.query(query, params) as any[];

    // Parse items_json and weapon_options for each item
    const parsedItems = items.map((item: any) => ({
      ...item,
      price: parseFloat(item.price),
      is_active: Boolean(item.is_active),
      featured: Boolean(item.featured),
      items_json: typeof item.items_json === 'string'
        ? JSON.parse(item.items_json)
        : item.items_json,
      weapon_options: item.weapon_options && typeof item.weapon_options === 'string'
        ? JSON.parse(item.weapon_options)
        : item.weapon_options
    }));

    res.json({
      success: true,
      items: parsedItems
    });
  } catch (error) {
    console.error('Error fetching market items:', error);
    res.status(500).json({
      error: 'Failed to fetch market items'
    });
  }
};

/**
 * Get single market item by ID
 */
export const getMarketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [items] = await db.query(
      'SELECT * FROM market_items WHERE id = ? AND is_active = 1',
      [id]
    ) as any[];

    if (!items || items.length === 0) {
      return res.status(404).json({
        error: 'Market item not found'
      });
    }

    const item = {
      ...items[0],
      price: parseFloat(items[0].price),
      is_active: Boolean(items[0].is_active),
      featured: Boolean(items[0].featured),
      items_json: typeof items[0].items_json === 'string'
        ? JSON.parse(items[0].items_json)
        : items[0].items_json
    };

    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Error fetching market item:', error);
    res.status(500).json({
      error: 'Failed to fetch market item'
    });
  }
};

/**
 * Get user's cart
 * Requires authentication
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [cartItems] = await db.query(
      `SELECT
        ci.*,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.category,
        mi.items_json,
        (ci.quantity * mi.price) as subtotal
      FROM cart_items ci
      JOIN market_items mi ON ci.market_item_id = mi.id
      WHERE ci.account_id = ? AND mi.is_active = 1`,
      [userId]
    ) as any[];

    const parsedCartItems = cartItems.map((item: any) => ({
      ...item,
      price: parseFloat(item.price),
      items_json: typeof item.items_json === 'string'
        ? JSON.parse(item.items_json)
        : item.items_json,
      subtotal: parseFloat(item.subtotal)
    }));

    const total = parsedCartItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);

    res.json({
      success: true,
      cart: parsedCartItems,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      error: 'Failed to fetch cart'
    });
  }
};

/**
 * Add item to cart
 * Requires authentication
 */
export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { market_item_id, quantity = 1, selected_weapon_id } = req.body as AddToCartRequest;

    if (!market_item_id) {
      return res.status(400).json({
        error: 'Market item ID is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        error: 'Quantity must be at least 1'
      });
    }

    // Check if item exists and is active
    const [items] = await db.query(
      'SELECT * FROM market_items WHERE id = ? AND is_active = 1',
      [market_item_id]
    ) as any[];

    if (!items || items.length === 0) {
      return res.status(404).json({
        error: 'Market item not found or not available'
      });
    }

    const item = items[0];

    // Validate weapon selection for set_with_weapon items
    if (item.category === 'set_with_weapon' && !selected_weapon_id) {
      return res.status(400).json({
        error: 'Weapon selection is required for this item'
      });
    }

    // Check stock
    if (item.stock !== -1 && item.stock < quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        available: item.stock
      });
    }

    // Check if item already in cart
    const [existingCart] = await db.query(
      'SELECT * FROM cart_items WHERE account_id = ? AND market_item_id = ?',
      [userId, market_item_id]
    ) as any[];

    if (existingCart && existingCart.length > 0) {
      // Update quantity and weapon selection
      const newQuantity = existingCart[0].quantity + quantity;

      if (item.stock !== -1 && item.stock < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock for requested quantity',
          available: item.stock,
          in_cart: existingCart[0].quantity
        });
      }

      await db.query(
        'UPDATE cart_items SET quantity = ?, selected_weapon_id = ? WHERE id = ?',
        [newQuantity, selected_weapon_id || null, existingCart[0].id]
      );
    } else {
      // Add new item to cart
      await db.query(
        'INSERT INTO cart_items (account_id, market_item_id, quantity, selected_weapon_id) VALUES (?, ?, ?, ?)',
        [userId, market_item_id, quantity, selected_weapon_id || null]
      );
    }

    res.json({
      success: true,
      message: 'Item added to cart'
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);

    // Check for foreign key constraint error
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(401).json({
        error: 'Your session is invalid. Please log out and log in again.',
        code: 'INVALID_SESSION'
      });
    }

    res.status(500).json({
      error: 'Failed to add item to cart',
      details: error.message
    });
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        error: 'Quantity must be at least 1'
      });
    }

    // Verify cart item belongs to user
    const [cartItems] = await db.query(
      'SELECT ci.*, mi.stock FROM cart_items ci JOIN market_items mi ON ci.market_item_id = mi.id WHERE ci.id = ? AND ci.account_id = ?',
      [id, userId]
    ) as any[];

    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({
        error: 'Cart item not found'
      });
    }

    const stock = cartItems[0].stock;

    if (stock !== -1 && stock < quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        available: stock
      });
    }

    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    res.json({
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({
      error: 'Failed to update cart'
    });
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    await db.query(
      'DELETE FROM cart_items WHERE id = ? AND account_id = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      error: 'Failed to remove item from cart'
    });
  }
};

/**
 * Clear user's cart
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await db.query(
      'DELETE FROM cart_items WHERE account_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      error: 'Failed to clear cart'
    });
  }
};

/**
 * Create checkout preference with MercadoPago
 * This creates a pending order and returns the MercadoPago preference URL
 */
export const createCheckout = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const userId = (req as any).user.userId;
    const { player_id } = req.body as CreateOrderRequest;

    if (!player_id) {
      return res.status(400).json({
        error: 'Player ID is required'
      });
    }

    await connection.beginTransaction();

    // Get user email
    const [accounts] = await connection.query(
      'SELECT email FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!accounts || accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Account not found'
      });
    }

    const userEmail = accounts[0].email;

    // Verify player belongs to user
    const [players] = await connection.query(
      'SELECT * FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [player_id, userId]
    ) as any[];

    if (!players || players.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Character not found or does not belong to your account'
      });
    }

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT
        ci.*,
        mi.name,
        mi.description,
        mi.price,
        mi.stock,
        mi.items_json,
        (ci.quantity * mi.price) as subtotal
      FROM cart_items ci
      JOIN market_items mi ON ci.market_item_id = mi.id
      WHERE ci.account_id = ? AND mi.is_active = 1`,
      [userId]
    ) as any[];

    if (!cartItems || cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Cart is empty'
      });
    }

    // Check stock for all items
    for (const item of cartItems) {
      if (item.stock !== -1 && item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}`,
          available: item.stock
        });
      }
    }

    // Calculate total
    const total = cartItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);

    // Create order with pending status
    const [orderResult] = await connection.query(
      'INSERT INTO orders (account_id, player_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, player_id, total, 'pending', 'mercadopago']
    ) as any;

    const orderId = orderResult.insertId;

    // Create order items
    for (const cartItem of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, market_item_id, quantity, price, item_name, items_json) VALUES (?, ?, ?, ?, ?, ?)',
        [
          orderId,
          cartItem.market_item_id,
          cartItem.quantity,
          cartItem.price,
          cartItem.name,
          JSON.stringify(typeof cartItem.items_json === 'string' ? JSON.parse(cartItem.items_json) : cartItem.items_json)
        ]
      );
    }

    // Create MercadoPago preference
    const itemsDescription = cartItems
      .map((item: any) => `${item.quantity}x ${item.name}`)
      .join(', ');

    const preference = await createSingleProductPreference({
      productName: `Order #${orderId} - Marketplace Items`,
      productDescription: itemsDescription,
      productId: orderId.toString(),
      productPrice: total,
      userEmail: userEmail,
      orderId: orderId.toString(),
    });

    // Save preference_id to order
    await connection.query(
      'UPDATE orders SET preference_id = ? WHERE id = ?',
      [preference.id, orderId]
    );

    await connection.commit();

    res.json({
      success: true,
      order_id: orderId,
      total: total.toFixed(2),
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      message: 'Checkout created successfully. Redirecting to payment...'
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error creating checkout:', error);
    res.status(500).json({
      error: 'Failed to create checkout',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * MercadoPago webhook handler
 * Handles payment notifications from MercadoPago
 */
export const handleMercadoPagoWebhook = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const payload = req.body as WebhookPayload;

    console.log('MercadoPago Webhook received:', payload);

    // Only process payment notifications
    if (payload.type === 'payment') {
      const mpPayment = await getPaymentById(payload.data.id);

      console.log('Payment details:', mpPayment);

      const orderId = mpPayment.external_reference;

      if (!orderId) {
        console.log('No external_reference found in payment');
        return res.status(400).json({ error: 'No order reference found' });
      }

      // Log the payment
      await connection.query(
        'INSERT INTO payment_logs (order_id, payment_provider, payment_id, status, status_detail, transaction_amount, webhook_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          orderId,
          'mercadopago',
          mpPayment.id,
          mpPayment.status,
          mpPayment.status_detail,
          mpPayment.transaction_amount,
          JSON.stringify(payload)
        ]
      );

      // Update order based on payment status
      if (mpPayment.status === 'approved') {
        console.log(`Payment ${mpPayment.id} approved for order ${orderId}`);

        await connection.beginTransaction();

        // Update order status
        await connection.query(
          'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
          ['approved', mpPayment.id?.toString() || null, orderId]
        );

        // Get order items to update stock
        const [orderItems] = await connection.query(
          'SELECT market_item_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        ) as any[];

        // Update stock for each item
        for (const item of orderItems) {
          await connection.query(
            'UPDATE market_items SET stock = stock - ? WHERE id = ? AND stock != -1',
            [item.quantity, item.market_item_id]
          );
        }

        // Clear user's cart
        const [orders] = await connection.query(
          'SELECT account_id FROM orders WHERE id = ?',
          [orderId]
        ) as any[];

        if (orders && orders.length > 0) {
          await connection.query(
            'DELETE FROM cart_items WHERE account_id = ?',
            [orders[0].account_id]
          );
        }

        await connection.commit();

        // TODO: Here you can add logic to deliver items to player's depot/mailbox
        // TODO: Send email notification to user

        return res.json({ success: true, message: 'Payment approved and order updated' });
      } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
        // Update order status to cancelled
        await connection.query(
          'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
          ['cancelled', mpPayment.id?.toString() || null, orderId]
        );

        return res.json({ success: true, message: 'Payment rejected, order cancelled' });
      }
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * DEPRECATED: Old create order function
 * Use createCheckout instead
 */
export const createOrder = async (_req: Request, res: Response) => {
  return res.status(410).json({
    error: 'This endpoint is deprecated. Use /checkout instead.',
    message: 'Please update your client to use the new checkout endpoint with MercadoPago integration.'
  });
};

/**
 * Get user's orders
 */
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [orders] = await db.query(
      `SELECT
        o.*,
        p.name as player_name,
        COUNT(oi.id) as total_items
      FROM orders o
      LEFT JOIN players p ON o.player_id = p.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.account_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [userId]
    ) as any[];

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
};

/**
 * Get order details
 */
export const getOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT
        o.*,
        p.name as player_name
      FROM orders o
      LEFT JOIN players p ON o.player_id = p.id
      WHERE o.id = ? AND o.account_id = ?`,
      [id, userId]
    ) as any[];

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    const [orderItems] = await db.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    ) as any[];

    const parsedItems = orderItems.map((item: any) => ({
      ...item,
      items_json: typeof item.items_json === 'string'
        ? JSON.parse(item.items_json)
        : item.items_json
    }));

    res.json({
      success: true,
      order: {
        ...orders[0],
        items: parsedItems
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      error: 'Failed to fetch order'
    });
  }
};

/**
 * Process payment with card token (Checkout API)
 * Integrates card form directly in the frontend
 */
export const processCardPayment = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const userId = (req as any).user.userId;
    const {
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      description,
      payer,
      player_id
    } = req.body;

    // Validate required fields
    if (!token || !issuer_id || !payment_method_id || !transaction_amount || !payer || !player_id) {
      return res.status(400).json({
        error: 'Missing required payment information'
      });
    }

    await connection.beginTransaction();

    // Get user's cart items
    const [cartItems] = await connection.query(
      `SELECT
        ci.*,
        mi.name,
        mi.description,
        mi.price,
        mi.stock,
        mi.items_json,
        (ci.quantity * mi.price) as subtotal
      FROM cart_items ci
      JOIN market_items mi ON ci.market_item_id = mi.id
      WHERE ci.account_id = ? AND mi.is_active = 1`,
      [userId]
    ) as any[];

    if (!cartItems || cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Cart is empty'
      });
    }

    // Verify transaction amount matches cart total
    const cartTotal = cartItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal), 0);

    if (Math.abs(cartTotal - transaction_amount) > 0.01) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Transaction amount does not match cart total'
      });
    }

    // Check stock for all items
    for (const item of cartItems) {
      if (item.stock !== -1 && item.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({
          error: `Insufficient stock for ${item.name}`,
          available: item.stock
        });
      }
    }

    // Verify player belongs to user
    const [players] = await connection.query(
      'SELECT * FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [player_id, userId]
    ) as any[];

    if (!players || players.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Character not found or does not belong to your account'
      });
    }

    // Create order with pending status
    const [orderResult] = await connection.query(
      'INSERT INTO orders (account_id, player_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?)',
      [userId, player_id, transaction_amount, 'pending', 'mercadopago_card']
    ) as any;

    const orderId = orderResult.insertId;

    // Create order items
    for (const cartItem of cartItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, market_item_id, quantity, price, item_name, items_json) VALUES (?, ?, ?, ?, ?, ?)',
        [
          orderId,
          cartItem.market_item_id,
          cartItem.quantity,
          cartItem.price,
          cartItem.name,
          JSON.stringify(typeof cartItem.items_json === 'string' ? JSON.parse(cartItem.items_json) : cartItem.items_json)
        ]
      );
    }

    // Process payment with MercadoPago
    try {
      const mpPayment = await createCardPayment({
        token,
        issuer_id,
        payment_method_id,
        transaction_amount,
        installments: installments || 1,
        description: description || `Order #${orderId} - Marketplace Items`,
        payer,
        external_reference: orderId.toString(),
        metadata: {
          order_id: orderId,
          user_id: userId
        }
      });

      console.log('MercadoPago payment created:', mpPayment);

      // Log the payment
      await connection.query(
        'INSERT INTO payment_logs (order_id, payment_provider, payment_id, status, status_detail, transaction_amount, webhook_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          orderId,
          'mercadopago',
          mpPayment.id,
          mpPayment.status,
          mpPayment.status_detail,
          mpPayment.transaction_amount,
          JSON.stringify(mpPayment)
        ]
      );

      // Update order with payment info
      if (mpPayment.status === 'approved') {
        await connection.query(
          'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
          ['approved', mpPayment.id?.toString() || null, orderId]
        );

        // Update stock for each item
        for (const item of cartItems) {
          await connection.query(
            'UPDATE market_items SET stock = stock - ? WHERE id = ? AND stock != -1',
            [item.quantity, item.market_item_id]
          );
        }

        // Deliver items to player depot
        try {
          // Prepare items for delivery
          const itemsToDeliver = cartItems.flatMap((cartItem: any) => {
            const itemsJson = typeof cartItem.items_json === 'string'
              ? JSON.parse(cartItem.items_json)
              : cartItem.items_json;

            // Each market item contains an array of game items
            return itemsJson.map((gameItem: any) => ({
              itemId: gameItem.itemId,
              count: gameItem.count * cartItem.quantity,
              name: gameItem.name
            }));
          });

          console.log(`Delivering ${itemsToDeliver.length} items to player ${player_id}:`, itemsToDeliver);

          // Use deliverItemsToDepot to add items directly to player_depotitems
          await deliverItemsToDepot(player_id, itemsToDeliver, orderId);

          console.log(`✅ Items delivered successfully to depot for order ${orderId}`);
        } catch (deliveryError) {
          console.error('❌ Error delivering items to depot:', deliveryError);
          // Don't fail the payment, just log the error
          // Items can be delivered manually later
        }

        // Clear user's cart
        await connection.query(
          'DELETE FROM cart_items WHERE account_id = ?',
          [userId]
        );

        await connection.commit();

        return res.json({
          success: true,
          payment: mpPayment,
          order_id: orderId,
          message: 'Payment approved successfully! Items will be delivered to your character.'
        });
      } else if (mpPayment.status === 'pending' || mpPayment.status === 'in_process') {
        await connection.query(
          'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
          ['pending', mpPayment.id?.toString() || null, orderId]
        );

        await connection.commit();

        return res.json({
          success: true,
          payment: mpPayment,
          order_id: orderId,
          message: 'Payment is pending approval'
        });
      } else {
        // Payment rejected or failed
        await connection.query(
          'UPDATE orders SET status = ?, payment_id = ? WHERE id = ?',
          ['cancelled', mpPayment.id?.toString() || null, orderId]
        );

        await connection.commit();

        return res.status(400).json({
          success: false,
          error: 'Payment was rejected',
          payment: mpPayment,
          status_detail: mpPayment.status_detail
        });
      }
    } catch (mpError: any) {
      await connection.rollback();
      console.error('MercadoPago payment error:', mpError);

      return res.status(500).json({
        success: false,
        error: 'Payment processing failed',
        details: mpError.message || 'Unknown error'
      });
    }
  } catch (error: any) {
    await connection.rollback();
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment',
      details: error.message
    });
  } finally {
    connection.release();
  }
};
