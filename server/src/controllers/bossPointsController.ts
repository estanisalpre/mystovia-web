import { Request, Response } from 'express';
import db from '../config/database.js';
import { deliverItemsToDepot } from '../services/itemDeliveryService.js';

/**
 * Get current user's boss points
 */
export const getBossPoints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [rows] = await db.query(
      'SELECT boss_points FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({
      success: true,
      bossPoints: rows[0].boss_points || 0
    });
  } catch (error) {
    console.error('Error getting boss points:', error);
    res.status(500).json({ error: 'Failed to get boss points' });
  }
};

/**
 * Get all marketplace items redeemable with boss points
 */
export const getShopItems = async (req: Request, res: Response) => {
  try {
    const [items] = await db.query(`
      SELECT * FROM market_items
      WHERE is_active = 1 AND redeemable_with_bp = 1 AND bp_price IS NOT NULL
      AND (stock = -1 OR stock > 0)
      ORDER BY bp_price ASC
    `) as any[];

    const parsedItems = (items || []).map((item: any) => ({
      ...item,
      is_active: Boolean(item.is_active),
      featured: Boolean(item.featured),
      redeemable_with_bp: Boolean(item.redeemable_with_bp),
      items_json: typeof item.items_json === 'string'
        ? JSON.parse(item.items_json)
        : item.items_json
    }));

    res.json({
      success: true,
      items: parsedItems
    });
  } catch (error: any) {
    console.error('Error getting shop items:', error);
    res.status(500).json({ error: 'Failed to get shop items' });
  }
};

/**
 * Purchase a marketplace item with boss points
 */
export const purchaseItem = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const userId = (req as any).user?.userId;
    const { item_id, player_id } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!item_id || !player_id) {
      return res.status(400).json({ error: 'Item ID and player ID are required' });
    }

    await connection.beginTransaction();

    // Get current boss points with lock
    const [accounts] = await connection.query(
      'SELECT boss_points FROM accounts WHERE id = ? FOR UPDATE',
      [userId]
    ) as any[];

    if (!accounts || accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Account not found' });
    }

    const currentPoints = accounts[0].boss_points || 0;

    // Get marketplace item that is redeemable with BP
    const [items] = await connection.query(
      `SELECT * FROM market_items
       WHERE id = ? AND is_active = 1 AND redeemable_with_bp = 1 AND bp_price IS NOT NULL`,
      [item_id]
    ) as any[];

    if (!items || items.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found or not redeemable with Boss Points' });
    }

    const marketItem = items[0];
    const bpPrice = marketItem.bp_price;

    // Check stock
    if (marketItem.stock !== -1 && marketItem.stock <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Item out of stock' });
    }

    // Check if player belongs to this account
    const [players] = await connection.query(
      'SELECT id, name FROM players WHERE id = ? AND account_id = ?',
      [player_id, userId]
    ) as any[];

    if (!players || players.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Player does not belong to this account' });
    }

    const playerName = players[0].name;

    // Check if user has enough points
    if (currentPoints < bpPrice) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Insufficient boss points',
        required: bpPrice,
        current: currentPoints
      });
    }

    // Deduct points
    await connection.query(
      'UPDATE accounts SET boss_points = boss_points - ? WHERE id = ?',
      [bpPrice, userId]
    );

    // Update stock if not unlimited
    if (marketItem.stock !== -1) {
      await connection.query(
        'UPDATE market_items SET stock = stock - 1 WHERE id = ?',
        [item_id]
      );
    }

    // Record purchase
    await connection.query(`
      INSERT INTO boss_points_purchases
      (account_id, player_name, market_item_id, item_name, points_spent)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, playerName, item_id, marketItem.name, bpPrice]);

    // Get purchase ID for delivery
    const [purchaseResult] = await connection.query(
      'SELECT LAST_INSERT_ID() as id'
    ) as any[];
    const purchaseId = purchaseResult[0].id;

    await connection.commit();

    // Parse items_json and deliver items
    const itemsToDeliver = typeof marketItem.items_json === 'string'
      ? JSON.parse(marketItem.items_json)
      : marketItem.items_json;

    try {
      await deliverItemsToDepot(player_id, itemsToDeliver, purchaseId);
    } catch (deliveryError) {
      console.error('Error delivering boss points item:', deliveryError);
    }

    res.json({
      success: true,
      message: 'Purchase successful',
      newBalance: currentPoints - bpPrice,
      item: marketItem.name
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error purchasing item:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  } finally {
    connection.release();
  }
};

/**
 * Get purchase history for current user
 */
export const getPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [purchases] = await db.query(`
      SELECT * FROM boss_points_purchases
      WHERE account_id = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `, [userId]) as any[];

    res.json({
      success: true,
      purchases: purchases || []
    });
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ success: true, purchases: [] });
    }
    console.error('Error getting purchase history:', error);
    res.status(500).json({ error: 'Failed to get purchase history' });
  }
};

/**
 * Get boss kill history for current user
 */
export const getKillHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [kills] = await db.query(`
      SELECT * FROM boss_points_log
      WHERE account_id = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `, [userId]) as any[];

    res.json({
      success: true,
      kills: kills || []
    });
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({ success: true, kills: [] });
    }
    console.error('Error getting kill history:', error);
    res.status(500).json({ error: 'Failed to get kill history' });
  }
};

/**
 * Get user's characters for purchase selection
 */
export const getCharacters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [characters] = await db.query(
      'SELECT id, name, level, vocation FROM players WHERE account_id = ? ORDER BY level DESC',
      [userId]
    ) as any[];

    res.json({
      success: true,
      characters: characters || []
    });
  } catch (error) {
    console.error('Error getting characters:', error);
    res.status(500).json({ error: 'Failed to get characters' });
  }
};
