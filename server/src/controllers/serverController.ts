import { Request, Response } from 'express';
import db from '../config/database.js';

export const getServerStats = async (req: Request, res: Response) => {
  try {
    // Total de jugadores registrados
    const [totalPlayersResult] = await db.query(
      'SELECT COUNT(*) AS total FROM players WHERE deleted = 0'
    );
    const totalPlayers = (totalPlayersResult as any)[0]?.total || 0;

    // Jugadores online
    const [onlinePlayersResult] = await db.query(
      'SELECT COUNT(*) AS online FROM players WHERE online = 1'
    );
    const onlinePlayers = (onlinePlayersResult as any)[0]?.online || 0;

    // Último uptime (opcional, se puede mejorar para calcular porcentaje)
    const [serverRecordResult] = await db.query(
      'SELECT record, timestamp FROM server_record ORDER BY timestamp DESC LIMIT 1'
    );
    const serverRecord = (serverRecordResult as any)[0] || { record: 0, timestamp: 0 };

    // Versión del servidor
    const [serverVersionResult] = await db.query(
      "SELECT value FROM server_config WHERE config = 'server_version'"
    );
    const serverVersion = (serverVersionResult as any)[0]?.value || 'N/A';

    res.json({
      totalPlayers,
      onlinePlayers,
      uptimeRecord: serverRecord,
      serverVersion
    });
  } catch (error) {
    console.error('Error fetching server stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
