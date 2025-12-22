import { Request, Response } from 'express';
import db from '../config/database.js';

// Get all guilds with member count and leader info
export const getGuilds = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get guilds with leader info and member count
    // Schema: players.rank_id references guild_ranks.id
    // guild_ranks.level: 1=Leader, 2=Vice Leader, 3=Member
    const [guilds] = await db.query(`
      SELECT
        g.id,
        g.name,
        g.ownerid,
        g.creationdata,
        g.logo IS NOT NULL as has_logo,
        p.name as owner_name,
        p.level as owner_level,
        (SELECT COUNT(*) FROM players pl
         JOIN guild_ranks gr ON pl.rank_id = gr.id
         WHERE gr.guild_id = g.id AND pl.deleted = 0) as member_count
      FROM guilds g
      LEFT JOIN players p ON p.id = g.ownerid
      ORDER BY member_count DESC, g.name ASC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Get total count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM guilds');
    const total = (countResult as any)[0].total;

    res.json({
      success: true,
      guilds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get guilds error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Get top guilds for landing page
export const getTopGuilds = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const [guilds] = await db.query(`
      SELECT
        g.id,
        g.name,
        g.ownerid,
        g.creationdata,
        g.logo IS NOT NULL as has_logo,
        p.name as owner_name,
        p.level as owner_level,
        (SELECT COUNT(*) FROM players pl
         JOIN guild_ranks gr ON pl.rank_id = gr.id
         WHERE gr.guild_id = g.id AND pl.deleted = 0) as member_count
      FROM guilds g
      LEFT JOIN players p ON p.id = g.ownerid
      ORDER BY member_count DESC, g.name ASC
      LIMIT ?
    `, [limit]);

    res.json({
      success: true,
      guilds
    });
  } catch (error) {
    console.error('Get top guilds error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Get guild logo
export const getGuildLogo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'SELECT logo FROM guilds WHERE id = ?',
      [id]
    );

    if (!Array.isArray(result) || result.length === 0 || !(result as any)[0].logo) {
      return res.status(404).json({ error: 'Logo no encontrado' });
    }

    const logo = (result as any)[0].logo;

    // Detect image type from buffer
    let contentType = 'image/png';
    if (logo[0] === 0xFF && logo[1] === 0xD8) {
      contentType = 'image/jpeg';
    } else if (logo[0] === 0x47 && logo[1] === 0x49 && logo[2] === 0x46) {
      contentType = 'image/gif';
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(logo);
  } catch (error) {
    console.error('Get guild logo error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Upload guild logo
export const uploadGuildLogo = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;

    // Check if user is guild leader
    const [guildCheck] = await db.query(`
      SELECT g.id FROM guilds g
      JOIN players p ON p.id = g.ownerid
      WHERE g.id = ? AND p.account_id = ?
    `, [guildId, userId]);

    if (!Array.isArray(guildCheck) || guildCheck.length === 0) {
      return res.status(403).json({ error: 'Solo el líder puede cambiar el logo' });
    }

    // Get base64 image from body
    const { logo } = req.body;

    if (!logo) {
      return res.status(400).json({ error: 'Logo es requerido' });
    }

    // Validate and parse base64
    const matches = logo.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Formato de imagen inválido. Use PNG, JPEG o GIF.' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Validate size (max 500KB)
    if (imageBuffer.length > 500 * 1024) {
      return res.status(400).json({ error: 'La imagen no debe superar 500KB' });
    }

    // Update guild logo
    await db.query(
      'UPDATE guilds SET logo = ? WHERE id = ?',
      [imageBuffer, guildId]
    );

    res.json({
      success: true,
      message: 'Logo actualizado'
    });
  } catch (error) {
    console.error('Upload guild logo error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Get guild details
export const getGuild = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get guild info
    const [guildResult] = await db.query(`
      SELECT
        g.id,
        g.name,
        g.ownerid,
        g.creationdata,
        g.logo IS NOT NULL as has_logo,
        p.name as owner_name,
        p.level as owner_level
      FROM guilds g
      LEFT JOIN players p ON p.id = g.ownerid
      WHERE g.id = ?
    `, [id]);

    if (!Array.isArray(guildResult) || guildResult.length === 0) {
      return res.status(404).json({ error: 'Guild no encontrada' });
    }

    const guild = (guildResult as any)[0];

    // Get guild members with ranks
    // guild_ranks.level: 1=Leader, 2=Vice Leader, 3=Member
    const [members] = await db.query(`
      SELECT
        p.id,
        p.name,
        p.level,
        p.vocation,
        gr.name as rank_name,
        gr.level as rank_level
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE gr.guild_id = ? AND p.deleted = 0
      ORDER BY gr.level ASC, p.level DESC
    `, [id]);

    // Get guild invites (pending) - no date column
    const [invites] = await db.query(`
      SELECT
        gi.player_id,
        gi.guild_id,
        p.name as player_name,
        p.level as player_level
      FROM guild_invites gi
      JOIN players p ON p.id = gi.player_id
      WHERE gi.guild_id = ?
    `, [id]);

    // Get guild ranks
    const [ranks] = await db.query(`
      SELECT id, name, level
      FROM guild_ranks
      WHERE guild_id = ?
      ORDER BY level ASC
    `, [id]);

    res.json({
      success: true,
      guild: {
        ...guild,
        members,
        invites,
        ranks
      }
    });
  } catch (error) {
    console.error('Get guild error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Create a new guild
export const createGuild = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, leaderId } = req.body;

    if (!name || !leaderId) {
      return res.status(400).json({ error: 'Nombre y líder son requeridos' });
    }

    // Validate guild name (only letters, numbers and spaces)
    const nameRegex = /^[A-Za-z0-9 ]{3,20}$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: 'El nombre de la guild debe tener entre 3-20 caracteres (letras, números y espacios)' });
    }

    // Check if player belongs to user
    const [playerCheck] = await db.query(
      'SELECT id, name, rank_id FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [leaderId, userId]
    );

    if (!Array.isArray(playerCheck) || playerCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para usar este personaje' });
    }

    // Check if player is already in a guild (rank_id > 0 means in a guild)
    const player = (playerCheck as any)[0];
    if (player.rank_id && player.rank_id > 0) {
      return res.status(400).json({ error: 'Este personaje ya pertenece a una guild' });
    }

    // Check if guild name exists
    const [guildCheck] = await db.query(
      'SELECT id FROM guilds WHERE LOWER(name) = LOWER(?)',
      [name]
    );

    if (Array.isArray(guildCheck) && guildCheck.length > 0) {
      return res.status(400).json({ error: 'Ya existe una guild con ese nombre' });
    }

    // Create guild (world_id defaults to 0)
    const creationTime = Math.floor(Date.now() / 1000);
    const [guildResult] = await db.query(
      'INSERT INTO guilds (name, ownerid, creationdata, world_id) VALUES (?, ?, ?, 0)',
      [name, leaderId, creationTime]
    );

    const guildId = (guildResult as any).insertId;

    // Create default ranks (level 1=Leader, 2=Vice Leader, 3=Member)
    await db.query(
      'INSERT INTO guild_ranks (guild_id, name, level) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [guildId, 'Leader', 1, guildId, 'Vice Leader', 2, guildId, 'Member', 3]
    );

    // Get leader rank (level 1)
    const [leaderRank] = await db.query(
      'SELECT id FROM guild_ranks WHERE guild_id = ? AND level = 1',
      [guildId]
    );

    // Add leader to guild by updating their rank_id
    if (Array.isArray(leaderRank) && leaderRank.length > 0) {
      await db.query(
        'UPDATE players SET rank_id = ? WHERE id = ?',
        [(leaderRank as any)[0].id, leaderId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Guild creada exitosamente',
      guildId
    });
  } catch (error) {
    console.error('Create guild error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Invite player to guild
export const invitePlayer = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerName } = req.body;

    if (!playerName) {
      return res.status(400).json({ error: 'Nombre del jugador es requerido' });
    }

    // Check if user is guild leader or vice leader
    // level 1=Leader, level 2=Vice Leader can invite
    const [memberCheck] = await db.query(`
      SELECT p.id, gr.level as rank_level
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE gr.guild_id = ? AND p.account_id = ? AND gr.level <= 2 AND p.deleted = 0
    `, [guildId, userId]);

    if (!Array.isArray(memberCheck) || memberCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para invitar jugadores' });
    }

    // Find player to invite
    const [playerResult] = await db.query(
      'SELECT id, name, rank_id FROM players WHERE LOWER(name) = LOWER(?) AND deleted = 0',
      [playerName]
    );

    if (!Array.isArray(playerResult) || playerResult.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    const player = (playerResult as any)[0];

    // Check if player is already in a guild (rank_id > 0)
    if (player.rank_id && player.rank_id > 0) {
      return res.status(400).json({ error: 'Este jugador ya pertenece a una guild' });
    }

    // Check if already invited to ANY guild
    const [existingInvite] = await db.query(
      'SELECT player_id, guild_id FROM guild_invites WHERE player_id = ?',
      [player.id]
    );

    if (Array.isArray(existingInvite) && existingInvite.length > 0) {
      const invite = (existingInvite as any)[0];
      if (invite.guild_id === parseInt(guildId)) {
        return res.status(400).json({ error: 'Este jugador ya tiene una invitación pendiente a esta guild' });
      } else {
        return res.status(400).json({ error: 'Este jugador ya tiene una invitación pendiente de otra guild' });
      }
    }

    // Create invite (no date column)
    try {
      await db.query(
        'INSERT INTO guild_invites (player_id, guild_id) VALUES (?, ?)',
        [player.id, guildId]
      );
    } catch (insertError: any) {
      if (insertError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este jugador ya tiene una invitación pendiente' });
      }
      throw insertError;
    }

    res.json({
      success: true,
      message: `Invitación enviada a ${player.name}`
    });
  } catch (error) {
    console.error('Invite player error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Accept guild invite
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId } = req.body;

    // Check if player belongs to user
    const [playerCheck] = await db.query(
      'SELECT id, rank_id FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [playerId, userId]
    );

    if (!Array.isArray(playerCheck) || playerCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para usar este personaje' });
    }

    // Check if player is already in a guild
    const player = (playerCheck as any)[0];
    if (player.rank_id && player.rank_id > 0) {
      return res.status(400).json({ error: 'Este personaje ya pertenece a una guild' });
    }

    // Check if invite exists
    const [inviteCheck] = await db.query(
      'SELECT player_id FROM guild_invites WHERE player_id = ? AND guild_id = ?',
      [playerId, guildId]
    );

    if (!Array.isArray(inviteCheck) || inviteCheck.length === 0) {
      return res.status(404).json({ error: 'No hay invitación pendiente' });
    }

    // Get member rank (level 3 = Member)
    const [memberRank] = await db.query(
      'SELECT id FROM guild_ranks WHERE guild_id = ? AND level = 3',
      [guildId]
    );

    if (!Array.isArray(memberRank) || memberRank.length === 0) {
      return res.status(500).json({ error: 'Error al obtener rango de miembro' });
    }

    // Remove invite
    await db.query(
      'DELETE FROM guild_invites WHERE player_id = ? AND guild_id = ?',
      [playerId, guildId]
    );

    // Add to guild by updating rank_id
    await db.query(
      'UPDATE players SET rank_id = ? WHERE id = ?',
      [(memberRank as any)[0].id, playerId]
    );

    res.json({
      success: true,
      message: 'Te has unido a la guild exitosamente'
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Reject guild invite
export const rejectInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId } = req.body;

    // Check if player belongs to user
    const [playerCheck] = await db.query(
      'SELECT id FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [playerId, userId]
    );

    if (!Array.isArray(playerCheck) || playerCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para usar este personaje' });
    }

    // Remove invite
    await db.query(
      'DELETE FROM guild_invites WHERE player_id = ? AND guild_id = ?',
      [playerId, guildId]
    );

    res.json({
      success: true,
      message: 'Invitación rechazada'
    });
  } catch (error) {
    console.error('Reject invite error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cancel guild invite (for leaders/vice leaders)
export const cancelInvite = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId } = req.body;

    // Check if user is guild leader or vice leader
    const [memberCheck] = await db.query(`
      SELECT p.id, gr.level as rank_level
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE gr.guild_id = ? AND p.account_id = ? AND gr.level <= 2 AND p.deleted = 0
    `, [guildId, userId]);

    if (!Array.isArray(memberCheck) || memberCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar invitaciones' });
    }

    // Remove invite
    await db.query(
      'DELETE FROM guild_invites WHERE player_id = ? AND guild_id = ?',
      [playerId, guildId]
    );

    res.json({
      success: true,
      message: 'Invitación cancelada'
    });
  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Leave guild
export const leaveGuild = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId } = req.body;

    // Check if player belongs to user and get their rank info
    const [playerCheck] = await db.query(`
      SELECT p.id, p.rank_id, gr.guild_id
      FROM players p
      LEFT JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE p.id = ? AND p.account_id = ? AND p.deleted = 0
    `, [playerId, userId]);

    if (!Array.isArray(playerCheck) || playerCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para usar este personaje' });
    }

    const player = (playerCheck as any)[0];

    // Check if player is actually in this guild
    if (!player.guild_id || player.guild_id !== parseInt(guildId)) {
      return res.status(400).json({ error: 'Este personaje no pertenece a esta guild' });
    }

    // Check if player is the guild leader
    const [guildCheck] = await db.query(
      'SELECT ownerid FROM guilds WHERE id = ?',
      [guildId]
    );

    if (Array.isArray(guildCheck) && guildCheck.length > 0) {
      if ((guildCheck as any)[0].ownerid === parseInt(playerId)) {
        return res.status(400).json({ error: 'El líder no puede abandonar la guild. Debes transferir el liderazgo o disolver la guild.' });
      }
    }

    // Remove from guild by setting rank_id to 0
    await db.query(
      'UPDATE players SET rank_id = 0 WHERE id = ?',
      [playerId]
    );

    res.json({
      success: true,
      message: 'Has abandonado la guild'
    });
  } catch (error) {
    console.error('Leave guild error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Kick member from guild
export const kickMember = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId } = req.body;

    // Check if user is guild leader or vice leader
    const [memberCheck] = await db.query(`
      SELECT p.id, gr.level as rank_level
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE gr.guild_id = ? AND p.account_id = ? AND gr.level <= 2 AND p.deleted = 0
    `, [guildId, userId]);

    if (!Array.isArray(memberCheck) || memberCheck.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para expulsar miembros' });
    }

    const kicker = (memberCheck as any)[0];

    // Get target player info
    const [targetCheck] = await db.query(`
      SELECT p.id, gr.level as rank_level, gr.guild_id
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE p.id = ? AND gr.guild_id = ?
    `, [playerId, guildId]);

    if (!Array.isArray(targetCheck) || targetCheck.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado en la guild' });
    }

    const target = (targetCheck as any)[0];

    // Can't kick someone with same or higher rank (lower level number = higher rank)
    if (target.rank_level <= kicker.rank_level) {
      return res.status(403).json({ error: 'No puedes expulsar a alguien con rango igual o superior' });
    }

    // Check if target is the guild leader
    const [guildCheck] = await db.query(
      'SELECT ownerid FROM guilds WHERE id = ?',
      [guildId]
    );

    if (Array.isArray(guildCheck) && guildCheck.length > 0) {
      if ((guildCheck as any)[0].ownerid === parseInt(playerId)) {
        return res.status(400).json({ error: 'No se puede expulsar al líder de la guild' });
      }
    }

    // Remove from guild
    await db.query(
      'UPDATE players SET rank_id = 0 WHERE id = ?',
      [playerId]
    );

    res.json({
      success: true,
      message: 'Miembro expulsado de la guild'
    });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Get player's guild invites
export const getPlayerInvites = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Get all player IDs for this account
    const [players] = await db.query(
      'SELECT id FROM players WHERE account_id = ? AND deleted = 0',
      [userId]
    );

    if (!Array.isArray(players) || players.length === 0) {
      return res.json({ success: true, invites: [] });
    }

    const playerIds = (players as any[]).map(p => p.id);

    // Get invites for all characters (no date column)
    const [invites] = await db.query(`
      SELECT
        gi.player_id,
        gi.guild_id,
        g.name as guild_name,
        p.name as player_name,
        owner.name as owner_name
      FROM guild_invites gi
      JOIN guilds g ON g.id = gi.guild_id
      JOIN players p ON p.id = gi.player_id
      JOIN players owner ON owner.id = g.ownerid
      WHERE gi.player_id IN (?)
    `, [playerIds]);

    res.json({
      success: true,
      invites
    });
  } catch (error) {
    console.error('Get player invites error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Delete guild logo
export const deleteGuildLogo = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;

    // Check if user is guild leader
    const [guildCheck] = await db.query(`
      SELECT g.id FROM guilds g
      JOIN players p ON p.id = g.ownerid
      WHERE g.id = ? AND p.account_id = ?
    `, [guildId, userId]);

    if (!Array.isArray(guildCheck) || guildCheck.length === 0) {
      return res.status(403).json({ error: 'Solo el líder puede eliminar el logo' });
    }

    await db.query(
      'UPDATE guilds SET logo = NULL WHERE id = ?',
      [guildId]
    );

    res.json({
      success: true,
      message: 'Logo eliminado'
    });
  } catch (error) {
    console.error('Delete guild logo error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Delete guild (only leader can do this)
export const deleteGuild = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;

    // Check if user is guild leader (owner)
    const [guildCheck] = await db.query(`
      SELECT g.id, g.ownerid, g.name FROM guilds g
      JOIN players p ON p.id = g.ownerid
      WHERE g.id = ? AND p.account_id = ?
    `, [guildId, userId]);

    if (!Array.isArray(guildCheck) || guildCheck.length === 0) {
      return res.status(403).json({ error: 'Solo el líder puede eliminar la guild' });
    }

    const guild = (guildCheck as any)[0];

    // Remove all members from guild (set rank_id = 0)
    await db.query(`
      UPDATE players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      SET p.rank_id = 0
      WHERE gr.guild_id = ?
    `, [guildId]);

    // Delete all pending invites
    await db.query(
      'DELETE FROM guild_invites WHERE guild_id = ?',
      [guildId]
    );

    // Delete guild ranks
    await db.query(
      'DELETE FROM guild_ranks WHERE guild_id = ?',
      [guildId]
    );

    // Delete guild
    await db.query(
      'DELETE FROM guilds WHERE id = ?',
      [guildId]
    );

    res.json({
      success: true,
      message: `Guild "${guild.name}" eliminada exitosamente`
    });
  } catch (error) {
    console.error('Delete guild error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Change member rank (only leader can do this)
export const changeMemberRank = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { guildId } = req.params;
    const { playerId, newRankLevel } = req.body;

    if (!playerId || newRankLevel === undefined) {
      return res.status(400).json({ error: 'Jugador y nuevo rango son requeridos' });
    }

    // Only leader (rank level 1) can change ranks
    const [guildCheck] = await db.query(`
      SELECT g.id, g.ownerid FROM guilds g
      JOIN players p ON p.id = g.ownerid
      WHERE g.id = ? AND p.account_id = ?
    `, [guildId, userId]);

    if (!Array.isArray(guildCheck) || guildCheck.length === 0) {
      return res.status(403).json({ error: 'Solo el líder puede cambiar rangos' });
    }

    const guild = (guildCheck as any)[0];

    // Can't change leader's rank
    if (parseInt(playerId) === guild.ownerid) {
      return res.status(400).json({ error: 'No puedes cambiar el rango del líder' });
    }

    // Validate new rank level (2 = Vice Leader, 3 = Member)
    if (![2, 3].includes(newRankLevel)) {
      return res.status(400).json({ error: 'Rango inválido' });
    }

    // Check if player is in this guild
    const [playerCheck] = await db.query(`
      SELECT p.id, gr.guild_id
      FROM players p
      JOIN guild_ranks gr ON p.rank_id = gr.id
      WHERE p.id = ? AND gr.guild_id = ?
    `, [playerId, guildId]);

    if (!Array.isArray(playerCheck) || playerCheck.length === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado en la guild' });
    }

    // Get the new rank id
    const [newRank] = await db.query(
      'SELECT id FROM guild_ranks WHERE guild_id = ? AND level = ?',
      [guildId, newRankLevel]
    );

    if (!Array.isArray(newRank) || newRank.length === 0) {
      return res.status(500).json({ error: 'Error al obtener el nuevo rango' });
    }

    // Update player's rank
    await db.query(
      'UPDATE players SET rank_id = ? WHERE id = ?',
      [(newRank as any)[0].id, playerId]
    );

    const rankName = newRankLevel === 2 ? 'Vice Leader' : 'Member';
    res.json({
      success: true,
      message: `Rango cambiado a ${rankName}`
    });
  } catch (error) {
    console.error('Change member rank error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
