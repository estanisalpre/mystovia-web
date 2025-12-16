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

// Mapeo de categorías a columnas de la BD
function getCategoryColumn(category: string): { column: string; table: string; skillId?: number } {
  const categories: { [key: string]: { column: string; table: string; skillId?: number } } = {
    'level': { column: 'level', table: 'players' },
    'experience': { column: 'experience', table: 'players' },
    'magiclevel': { column: 'maglevel', table: 'players' },
    'skill_fist': { column: 'value', table: 'player_skills', skillId: 0 },
    'skill_club': { column: 'value', table: 'player_skills', skillId: 1 },
    'skill_sword': { column: 'value', table: 'player_skills', skillId: 2 },
    'skill_axe': { column: 'value', table: 'player_skills', skillId: 3 },
    'skill_dist': { column: 'value', table: 'player_skills', skillId: 4 },
    'skill_shielding': { column: 'value', table: 'player_skills', skillId: 5 },
    'skill_fishing': { column: 'value', table: 'player_skills', skillId: 6 },
  };
  return categories[category] || categories['level'];
}

export const getHighscores = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const vocation = req.query.vocation as string || '';
    const category = req.query.category as string || 'level';

    const offset = (page - 1) * limit;
    const categoryData = getCategoryColumn(category);

    let query: string;
    let countQuery: string;
    let params: any[] = [];
    let countParams: any[] = [];

    // Construir WHERE clause para vocación
    let vocationWhere = '';
    if (vocation) {
      vocationWhere = 'AND p.vocation = ?';
      params.push(parseInt(vocation));
      countParams.push(parseInt(vocation));
    }

    if (categoryData.table === 'player_skills') {
      // Query para skills
      query = `
        SELECT
          p.id,
          p.name,
          p.vocation,
          p.level,
          ps.value as points
        FROM players p
        INNER JOIN player_skills ps ON ps.player_id = p.id AND ps.skillid = ?
        WHERE p.deleted = 0
          AND p.group_id < 3
          ${vocationWhere}
        ORDER BY ps.value DESC, p.level DESC
        LIMIT ? OFFSET ?
      `;
      params = [categoryData.skillId, ...params, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM players p
        INNER JOIN player_skills ps ON ps.player_id = p.id AND ps.skillid = ?
        WHERE p.deleted = 0 AND p.group_id < 3 ${vocationWhere}
      `;
      countParams = [categoryData.skillId, ...countParams];
    } else {
      // Query para level, experience, maglevel
      const pointsColumn = category === 'experience' ? 'p.experience' :
                          category === 'magiclevel' ? 'p.maglevel' : 'p.level';

      query = `
        SELECT
          p.id,
          p.name,
          p.vocation,
          p.level,
          ${pointsColumn} as points
        FROM players p
        WHERE p.deleted = 0
          AND p.group_id < 3
          ${vocationWhere}
        ORDER BY ${pointsColumn} DESC, p.level DESC
        LIMIT ? OFFSET ?
      `;
      params = [...params, limit, offset];

      countQuery = `
        SELECT COUNT(*) as total
        FROM players p
        WHERE p.deleted = 0 AND p.group_id < 3 ${vocationWhere}
      `;
    }

    // Ejecutar queries
    const [players] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Mapear resultados
    const mappedPlayers = (players as any[]).map((player, index) => ({
      rank: offset + index + 1,
      id: player.id,
      name: player.name,
      vocation: getVocationName(player.vocation),
      vocationId: player.vocation,
      level: player.level,
      points: player.points
    }));

    res.json({
      players: mappedPlayers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      lastUpdate: new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

  } catch (error) {
    console.error('Get highscores error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
