import { Request, Response } from 'express';
import db from '../config/database.js';
import {
  CreateMarketItemRequest,
  UpdateMarketItemRequest
} from '../types/index.js';

/**
 * Get all market items (including inactive)
 * Admin only
 */
export const getAllMarketItems = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;

    let query = 'SELECT * FROM market_items WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status === 'active') {
      query += ' AND is_active = 1';
    } else if (status === 'inactive') {
      query += ' AND is_active = 0';
    }

    query += ' ORDER BY created_at DESC';

    const [items] = await db.query(query, params) as any[];

    const parsedItems = items.map((item: any) => ({
      ...item,
      is_active: Boolean(item.is_active),
      featured: Boolean(item.featured),
      items_json: typeof item.items_json === 'string'
        ? JSON.parse(item.items_json)
        : item.items_json
    }));

    res.json({
      success: true,
      items: parsedItems
    });
  } catch (error) {
    console.error('Error fetching all market items:', error);
    res.status(500).json({
      error: 'Failed to fetch market items'
    });
  }
};

/**
 * Create new market item
 * Admin only
 */
export const createMarketItem = async (req: Request, res: Response) => {
  try {
    // Debug: Log the incoming request body
    //console.log('📦 Creating market item - Request body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      description,
      price,
      image_url,
      category,
      stock = -1,
      featured = false,
      items_json
    } = req.body as CreateMarketItemRequest;

    // Debug: Log extracted image_url
    //console.log('🖼️ Extracted image_url:', image_url);

    // Validation
    if (!name || !price || !category || !items_json) {
      return res.status(400).json({
        error: 'Name, price, category, and items_json are required'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        error: 'Price must be a positive number'
      });
    }

    if (!Array.isArray(items_json) || items_json.length === 0) {
      return res.status(400).json({
        error: 'items_json must be a non-empty array'
      });
    }

    const [result] = await db.query(
      `INSERT INTO market_items
        (name, description, price, image_url, category, stock, featured, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        image_url || null,
        category,
        stock,
        featured ? 1 : 0,
        JSON.stringify(items_json)
      ]
    ) as any;

    res.status(201).json({
      success: true,
      item_id: result.insertId,
      message: 'Market item created successfully'
    });
  } catch (error) {
    console.error('Error creating market item:', error);
    res.status(500).json({
      error: 'Failed to create market item'
    });
  }
};

/**
 * Update market item
 * Admin only
 */
export const updateMarketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateMarketItemRequest;

    // Check if item exists
    const [existing] = await db.query(
      'SELECT * FROM market_items WHERE id = ?',
      [id]
    ) as any[];

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: 'Market item not found'
      });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (updateData.name !== undefined) {
      updates.push('name = ?');
      values.push(updateData.name);
    }

    if (updateData.description !== undefined) {
      updates.push('description = ?');
      values.push(updateData.description || null);
    }

    if (updateData.price !== undefined) {
      if (updateData.price < 0) {
        return res.status(400).json({
          error: 'Price must be a positive number'
        });
      }
      updates.push('price = ?');
      values.push(updateData.price);
    }

    if (updateData.image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(updateData.image_url || null);
    }

    if (updateData.category !== undefined) {
      updates.push('category = ?');
      values.push(updateData.category);
    }

    if (updateData.stock !== undefined) {
      updates.push('stock = ?');
      values.push(updateData.stock);
    }

    if (updateData.featured !== undefined) {
      updates.push('featured = ?');
      values.push(updateData.featured ? 1 : 0);
    }

    if (updateData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(updateData.is_active ? 1 : 0);
    }

    if (updateData.items_json !== undefined) {
      if (!Array.isArray(updateData.items_json) || updateData.items_json.length === 0) {
        return res.status(400).json({
          error: 'items_json must be a non-empty array'
        });
      }
      updates.push('items_json = ?');
      values.push(JSON.stringify(updateData.items_json));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE market_items SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Market item updated successfully'
    });
  } catch (error) {
    console.error('Error updating market item:', error);
    res.status(500).json({
      error: 'Failed to update market item'
    });
  }
};

/**
 * Delete market item
 * Admin only
 */
export const deleteMarketItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [existing] = await db.query(
      'SELECT * FROM market_items WHERE id = ?',
      [id]
    ) as any[];

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: 'Market item not found'
      });
    }

    // Check if item has been ordered
    const [orders] = await db.query(
      'SELECT COUNT(*) as count FROM order_items WHERE market_item_id = ?',
      [id]
    ) as any[];

    if (orders[0].count > 0) {
      // Soft delete - just deactivate
      await db.query(
        'UPDATE market_items SET is_active = 0 WHERE id = ?',
        [id]
      );

      return res.json({
        success: true,
        message: 'Market item deactivated (has existing orders)'
      });
    }

    // Hard delete if no orders
    await db.query('DELETE FROM market_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Market item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting market item:', error);
    res.status(500).json({
      error: 'Failed to delete market item'
    });
  }
};

/**
 * Toggle market item active status
 * Admin only
 */
export const toggleMarketItemStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query(
      'SELECT is_active FROM market_items WHERE id = ?',
      [id]
    ) as any[];

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: 'Market item not found'
      });
    }

    const newStatus = existing[0].is_active ? 0 : 1;

    await db.query(
      'UPDATE market_items SET is_active = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      is_active: Boolean(newStatus),
      message: `Market item ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling market item status:', error);
    res.status(500).json({
      error: 'Failed to toggle market item status'
    });
  }
};

/**
 * Get all orders with details
 * Admin only - supports pagination and search
 */
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let baseQuery = `
      FROM orders o
      LEFT JOIN accounts a ON o.account_id = a.id
      LEFT JOIN players p ON o.player_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      baseQuery += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      baseQuery += ' AND (a.email LIKE ? OR p.name LIKE ? OR o.id = ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, Number(search) || 0);
    }

    // Count total orders
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT o.id) as total ${baseQuery}`,
      params
    ) as any[];
    const total = countResult[0].total;

    // Get orders with pagination
    const [orders] = await db.query(
      `SELECT
        o.*,
        a.email as account_email,
        p.name as player_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as total_items
      ${baseQuery}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    ) as any[];

    // Get summary stats
    const [statsResult] = await db.query(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'approved' OR status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM orders
    `) as any[];

    res.json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      stats: statsResult[0]
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
};

/**
 * Update order status
 * Admin only
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'approved', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        valid_statuses: validStatuses
      });
    }

    // Check if order exists
    const [existing] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    ) as any[];

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Update status
    const updateFields: string[] = ['status = ?'];
    const updateValues: any[] = [status];

    // If marking as delivered, set delivered_at timestamp
    if (status === 'delivered') {
      updateFields.push('delivered_at = NOW()');
    }

    updateValues.push(id);

    await db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      error: 'Failed to update order status'
    });
  }
};

/**
 * Get marketplace statistics
 * Admin only
 */
export const getMarketplaceStats = async (req: Request, res: Response) => {
  try {
    // Total sales
    const [salesStats] = await db.query(
      `SELECT
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value
      FROM orders
      WHERE status IN ('approved', 'delivered')`
    ) as any[];

    // Sales by status
    const [statusStats] = await db.query(
      `SELECT
        status,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders
      GROUP BY status`
    ) as any[];

    // Top selling items
    const [topItems] = await db.query(
      `SELECT
        mi.id,
        mi.name,
        mi.category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN market_items mi ON oi.market_item_id = mi.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status IN ('approved', 'delivered')
      GROUP BY mi.id
      ORDER BY total_sold DESC
      LIMIT 10`
    ) as any[];

    // Recent activity
    const [recentOrders] = await db.query(
      `SELECT
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        a.email as account_email
      FROM orders o
      JOIN accounts a ON o.account_id = a.id
      ORDER BY o.created_at DESC
      LIMIT 10`
    ) as any[];

    res.json({
      success: true,
      stats: {
        sales: salesStats[0],
        by_status: statusStats,
        top_items: topItems,
        recent_orders: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      error: 'Failed to fetch marketplace statistics'
    });
  }
};
