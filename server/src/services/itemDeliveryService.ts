import db from '../config/database.js';

/**
 * Item Delivery Service
 * Handles delivery of purchased items to player's depot or inbox
 */

interface DeliveryItem {
  itemId: number | string;
  count: number;
  name: string;
}

/**
 * Deliver items to player's inbox
 * In TFS, inbox is typically stored in player_depotitems with a specific parent ID
 *
 * @param playerId - The player ID to deliver items to
 * @param items - Array of items to deliver
 * @param orderId - The order ID for reference
 * @returns true if successful, false otherwise
 */
export async function deliverItemsToInbox(
  playerId: number,
  items: DeliveryItem[],
  orderId: number
): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get player info
    const [players] = await connection.query(
      'SELECT name, account_id FROM players WHERE id = ?',
      [playerId]
    ) as any[];

    if (!players || players.length === 0) {
      throw new Error(`Player ${playerId} not found`);
    }

    const playerName = players[0].name;
    const accountId = players[0].account_id;

    console.log(`Delivering items to player: ${playerName} (ID: ${playerId})`);

    // In TFS, items are typically stored in player_depotitems table
    // We need to find the inbox container ID for this player
    // Inbox typically has a specific depot_id (commonly depot_id = 1 for main depot)

    // Option 1: Insert items directly into player_depotitems (if table exists)
    // Option 2: Use player_storage to track delivered items
    // Option 3: Send in-game mail (if supported)

    // Let's use player_storage to track delivered items
    // This is safer and works with any TFS version

    const itemsJson = JSON.stringify({
      order_id: orderId,
      items: items,
      delivered_at: new Date().toISOString(),
      player_id: playerId,
      player_name: playerName
    });

    // Store in a custom storage key (we'll use a high number to avoid conflicts)
    // Storage key format: 50000 + order_id
    const storageKey = 50000 + orderId;

    // Check if player_storage table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'player_storage'"
    ) as any[];

    if (tables && tables.length > 0) {
      // Insert into player_storage for tracking
      await connection.query(
        'INSERT INTO player_storage (player_id, `key`, value) VALUES (?, ?, ?)',
        [playerId, storageKey, 1] // value = 1 means "delivered"
      );

      console.log(`Stored delivery record in player_storage with key: ${storageKey}`);
    }

    // Create a delivery log entry in a custom table
    // First, check if the table exists, if not create it
    await connection.query(`
      CREATE TABLE IF NOT EXISTS item_deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        player_id INT NOT NULL,
        account_id INT NOT NULL,
        items_json TEXT NOT NULL,
        delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        claimed TINYINT(1) DEFAULT 0,
        claimed_at TIMESTAMP NULL,
        INDEX idx_player (player_id),
        INDEX idx_order (order_id),
        INDEX idx_claimed (claimed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);

    // Insert delivery record
    await connection.query(
      'INSERT INTO item_deliveries (order_id, player_id, account_id, items_json) VALUES (?, ?, ?, ?)',
      [orderId, playerId, accountId, itemsJson]
    );

    await connection.commit();

    console.log(`✅ Successfully delivered items for order ${orderId} to player ${playerName}`);
    console.log(`Items:`, items);

    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`❌ Error delivering items for order ${orderId}:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * ADVANCED: Deliver items directly to player depot
 * This requires knowing the exact TFS schema
 * Use this if you want items to appear immediately in-game
 *
 * NOTE: This is commented out because it requires specific TFS schema knowledge
 */
/*
export async function deliverItemsToDepot(
  playerId: number,
  items: DeliveryItem[],
  orderId: number
): Promise<boolean> {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // TFS typically uses player_depotitems table
    // Structure: (player_id, sid, pid, itemtype, count, attributes)
    // sid = slot id (depot slot)
    // pid = parent id (depot container)

    // Find depot container for player
    const [depots] = await connection.query(
      'SELECT * FROM player_depotitems WHERE player_id = ? AND pid = 0 ORDER BY sid LIMIT 1',
      [playerId]
    ) as any[];

    let depotId;
    if (depots && depots.length > 0) {
      depotId = depots[0].sid;
    } else {
      // Create depot if doesn't exist
      // This is server-specific
      throw new Error('Depot not found. Items will be delivered via storage system instead.');
    }

    // Insert each item into depot
    for (const item of items) {
      // Get next available slot in depot
      const [maxSlot] = await connection.query(
        'SELECT MAX(sid) as max_sid FROM player_depotitems WHERE player_id = ? AND pid = ?',
        [playerId, depotId]
      ) as any[];

      const nextSlot = (maxSlot[0].max_sid || 0) + 1;

      // Insert item
      await connection.query(
        'INSERT INTO player_depotitems (player_id, sid, pid, itemtype, count) VALUES (?, ?, ?, ?, ?)',
        [playerId, nextSlot, depotId, item.itemId, item.count]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error delivering to depot:', error);
    throw error;
  } finally {
    connection.release();
  }
}
*/

/**
 * Get pending deliveries for a player
 */
export async function getPendingDeliveries(playerId: number) {
  try {
    const [deliveries] = await db.query(
      'SELECT * FROM item_deliveries WHERE player_id = ? AND claimed = 0 ORDER BY delivered_at DESC',
      [playerId]
    ) as any[];

    return deliveries.map((delivery: any) => ({
      ...delivery,
      items_json: typeof delivery.items_json === 'string'
        ? JSON.parse(delivery.items_json)
        : delivery.items_json
    }));
  } catch (error) {
    console.error('Error getting pending deliveries:', error);
    return [];
  }
}

/**
 * Mark delivery as claimed
 */
export async function markDeliveryAsClaimed(deliveryId: number) {
  try {
    await db.query(
      'UPDATE item_deliveries SET claimed = 1, claimed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [deliveryId]
    );
    return true;
  } catch (error) {
    console.error('Error marking delivery as claimed:', error);
    return false;
  }
}
