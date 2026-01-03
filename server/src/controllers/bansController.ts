import { Request, Response } from 'express';
import db from '../config/database.js';

// Tipos de baneo según la estructura de la tabla
// 1 - IP Banishment, 2 - Namelock, 3 - Account Banishment, 4 - Notation, 5 - Deletion
function getBanTypeName(type: number): string {
  const types: { [key: number]: string } = {
    1: 'IP Ban',
    2: 'Namelock',
    3: 'Account Ban',
    4: 'Notation',
    5: 'Deletion'
  };
  return types[type] || 'Ban';
}

export const getActiveBans = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

    // Query adaptada a la estructura real de la tabla bans
    // type: 1=IP, 2=Namelock (player), 3=Account ban, 4=Notation, 5=Deletion
    // value: IP (integer), player guid, o account number según el type
    // Para account bans, buscar primero un player de esa cuenta para mostrar su nombre
    const [bans] = await db.query(
      `SELECT
         b.id,
         b.type,
         b.value,
         b.param,
         b.active,
         b.expires,
         b.added,
         b.comment,
         b.reason,
         b.action,
         b.statement,
         CASE
           WHEN b.type = 2 THEN p.name
           WHEN b.type IN (3, 4, 5) THEN COALESCE(acc_player.name, a.name, CAST(b.value AS CHAR))
           WHEN b.type = 1 THEN CONCAT(
             (b.value >> 24) & 255, '.',
             (b.value >> 16) & 255, '.',
             (b.value >> 8) & 255, '.',
             b.value & 255
           )
           ELSE CAST(b.value AS CHAR)
         END as banned_name,
         admin.name as banned_by
       FROM bans b
       LEFT JOIN players p ON b.type = 2 AND b.value = p.id
       LEFT JOIN accounts a ON b.type IN (3, 4, 5) AND b.value = a.id
       LEFT JOIN players acc_player ON b.type IN (3, 4, 5) AND acc_player.account_id = b.value
       LEFT JOIN players admin ON b.admin_id = admin.id
       WHERE b.active = 1
       GROUP BY b.id
       ORDER BY b.added DESC
       LIMIT ?`,
      [limit]
    );

    const mappedBans = (bans as any[]).map(ban => ({
      id: ban.id,
      type: getBanTypeName(ban.type),
      bannedName: ban.banned_name || 'Unknown',
      comment: ban.comment || null,
      reason: ban.reason || null,
      action: ban.action || null,
      statement: ban.statement || null,
      expires: ban.expires,
      isPermanent: ban.expires === 0 || ban.expires === -1 || ban.expires === null,
      addedAt: ban.added,
      bannedBy: ban.banned_by || 'System'
    }));

    res.json({
      bans: mappedBans,
      total: mappedBans.length,
      lastUpdate: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

  } catch (error) {
    console.error('Get active bans error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
