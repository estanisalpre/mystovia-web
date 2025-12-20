import { Request, Response } from 'express';
import db from '../config/database.js';

// Mapeo de vocaciones
function getVocationName(vocationId: number): string {
  const vocations: { [key: number]: string } = {
    0: 'None',
    1: 'Sorcerer',
    2: 'Druid',
    3: 'Paladin',
    4: 'Knight',
    5: 'Master Sorcerer',
    6: 'Elder Druid',
    7: 'Royal Paladin',
    8: 'Elite Knight'
  };
  return vocations[vocationId] || 'Unknown';
}

export const getLatestDeaths = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    const [deaths] = await db.query(
      `SELECT
         pd.id,
         pd.date,
         pd.level,
         p.id as player_id,
         p.name as player_name,
         p.vocation as player_vocation,
         COALESCE(killer_player.name, ek.name) AS killed_by,
         CASE WHEN pk.player_id IS NOT NULL THEN 1 ELSE 0 END AS is_player_kill
       FROM player_deaths pd
       INNER JOIN players p ON p.id = pd.player_id
       LEFT JOIN killers k ON k.death_id = pd.id
       LEFT JOIN player_killers pk ON pk.kill_id = k.id
       LEFT JOIN players killer_player ON killer_player.id = pk.player_id
       LEFT JOIN environment_killers ek ON ek.kill_id = k.id
       WHERE p.deleted = 0 AND p.group_id < 3
       ORDER BY pd.date DESC
       LIMIT ?`,
      [limit]
    );

    const mappedDeaths = (deaths as any[]).map(death => ({
      id: death.id,
      date: death.date,
      level: death.level,
      player: {
        id: death.player_id,
        name: death.player_name,
        vocation: getVocationName(death.player_vocation)
      },
      killedBy: death.killed_by || 'Unknown',
      isPlayerKill: death.is_player_kill === 1
    }));

    res.json({
      deaths: mappedDeaths,
      total: mappedDeaths.length,
      lastUpdate: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

  } catch (error) {
    console.error('Get latest deaths error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
