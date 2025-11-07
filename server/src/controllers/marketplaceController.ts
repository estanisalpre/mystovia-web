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
 * Create order from cart
 * This creates a pending order - payment integration will be added later
 */
export const createOrder = async (req: Request, res: Response) => {
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

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (account_id, player_id, total_amount, status) VALUES (?, ?, ?, ?)',
      [userId, player_id, total, 'pending']
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

      // Update stock if not unlimited
      if (cartItem.stock !== -1) {
        await connection.query(
          'UPDATE market_items SET stock = stock - ? WHERE id = ?',
          [cartItem.quantity, cartItem.market_item_id]
        );
      }
    }

    // Clear cart
    await connection.query(
      'DELETE FROM cart_items WHERE account_id = ?',
      [userId]
    );

    await connection.commit();

    res.json({
      success: true,
      order_id: orderId,
      total: total.toFixed(2),
      message: 'Order created successfully. Proceed to payment.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order'
    });
  } finally {
    connection.release();
  }
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
