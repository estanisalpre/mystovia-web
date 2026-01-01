import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// CATEGORÍAS DEL FORO
// ============================================

/** Obtener todas las categorías */
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      `SELECT
        fc.*,
        COUNT(ft.id) as topics_count
      FROM forum_categories fc
      LEFT JOIN forum_topics ft ON fc.id = ft.category_id
      WHERE fc.is_active = 1
      GROUP BY fc.id
      ORDER BY fc.order_position ASC`
    ) as any[];

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// TEMAS DEL FORO
// ============================================

/** Obtener temas por categoría */
export const getTopicsByCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [topics] = await db.query(
      `SELECT
        ft.id,
        ft.title,
        ft.content,
        ft.is_pinned,
        ft.is_locked,
        ft.views_count,
        ft.created_at,
        ft.updated_at,
        COALESCE(p.name, a.name) as author_name,
        (SELECT COUNT(*) FROM forum_comments WHERE topic_id = ft.id) as comments_count,
        COALESCE(SUM(ftv.vote), 0) as total_votes
      FROM forum_topics ft
      LEFT JOIN players p ON ft.character_id = p.id
      LEFT JOIN accounts a ON ft.author_id = a.id
      LEFT JOIN forum_topic_votes ftv ON ft.id = ftv.topic_id
      WHERE ft.category_id = ?
      GROUP BY ft.id
      ORDER BY ft.is_pinned DESC, ft.updated_at DESC
      LIMIT ? OFFSET ?`,
      [categoryId, limit, offset]
    ) as any[];

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM forum_topics WHERE category_id = ?',
      [categoryId]
    ) as any[];

    res.json({
      success: true,
      topics,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo temas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener un tema específico con sus comentarios */
export const getTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const userId = (req as any).user?.userId;

    // Incrementar contador de vistas
    await db.query(
      'UPDATE forum_topics SET views_count = views_count + 1 WHERE id = ?',
      [topicId]
    );

    // Obtener el tema
    const [topics] = await db.query(
      `SELECT
        ft.id,
        ft.category_id,
        ft.title,
        ft.content,
        ft.is_pinned,
        ft.is_locked,
        ft.views_count,
        ft.created_at,
        ft.updated_at,
        ft.character_id,
        COALESCE(p.name, a.name) as author_name,
        COALESCE(SUM(ftv.vote), 0) as total_votes
      FROM forum_topics ft
      LEFT JOIN players p ON ft.character_id = p.id
      LEFT JOIN accounts a ON ft.author_id = a.id
      LEFT JOIN forum_topic_votes ftv ON ft.id = ftv.topic_id
      WHERE ft.id = ?
      GROUP BY ft.id`,
      [topicId]
    ) as any[];

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    const topic = topics[0];

    // Obtener el voto del usuario actual (si está autenticado)
    let userVote = null;
    if (userId) {
      const [votes] = await db.query(
        'SELECT vote FROM forum_topic_votes WHERE topic_id = ? AND user_id = ?',
        [topicId, userId]
      ) as any[];
      userVote = votes.length > 0 ? votes[0].vote : null;
    }

    // Obtener comentarios
    const [comments] = await db.query(
      `SELECT
        fc.id,
        fc.content,
        fc.created_at,
        fc.updated_at,
        fc.character_id,
        COALESCE(p.name, a.name) as author_name
      FROM forum_comments fc
      LEFT JOIN players p ON fc.character_id = p.id
      LEFT JOIN accounts a ON fc.author_id = a.id
      WHERE fc.topic_id = ?
      ORDER BY fc.created_at ASC`,
      [topicId]
    ) as any[];

    res.json({
      success: true,
      topic: { ...topic, userVote },
      comments
    });
  } catch (error) {
    console.error('Error obteniendo tema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Crear un nuevo tema */
export const createTopic = async (req: Request, res: Response) => {
  try {
    const { categoryId, characterId, title, content } = req.body;
    const userId = (req as any).user.userId;

    if (!categoryId || !characterId || !title || !content) {
      return res.status(400).json({ error: 'Categoría, personaje, título y contenido son requeridos' });
    }

    // Verificar que el personaje pertenece al usuario
    const [characters] = await db.query(
      'SELECT id FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [characterId, userId]
    ) as any[];

    if (characters.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para publicar con este personaje' });
    }

    const [result] = await db.query(
      `INSERT INTO forum_topics (category_id, author_id, character_id, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [categoryId, userId, characterId, title, content]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Tema creado exitosamente',
      topicId: result.insertId
    });
  } catch (error) {
    console.error('Error creando tema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Votar en un tema */
export const voteTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { vote } = req.body; // 1 o -1
    const userId = (req as any).user.userId;

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ error: 'El voto debe ser 1 o -1' });
    }

    // Verificar si ya votó
    const [existingVotes] = await db.query(
      'SELECT vote FROM forum_topic_votes WHERE topic_id = ? AND user_id = ?',
      [topicId, userId]
    ) as any[];

    let userVote = vote;

    if (existingVotes.length > 0) {
      const currentVote = existingVotes[0].vote;

      if (currentVote === vote) {
        // Remover voto si es el mismo
        await db.query(
          'DELETE FROM forum_topic_votes WHERE topic_id = ? AND user_id = ?',
          [topicId, userId]
        );
        userVote = null;
      } else {
        // Actualizar voto
        await db.query(
          'UPDATE forum_topic_votes SET vote = ? WHERE topic_id = ? AND user_id = ?',
          [vote, topicId, userId]
        );
      }
    } else {
      // Insertar nuevo voto
      await db.query(
        'INSERT INTO forum_topic_votes (topic_id, user_id, vote) VALUES (?, ?, ?)',
        [topicId, userId, vote]
      );
    }

    // Obtener el total de votos actualizado
    const [voteResult] = await db.query(
      'SELECT COALESCE(SUM(vote), 0) as total_votes FROM forum_topic_votes WHERE topic_id = ?',
      [topicId]
    ) as any[];

    const totalVotes = voteResult[0].total_votes;

    res.json({
      success: true,
      message: userVote === null ? 'Voto removido' : 'Voto registrado',
      userVote,
      totalVotes
    });
  } catch (error) {
    console.error('Error votando tema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Agregar comentario a un tema */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { content, characterId } = req.body;
    const userId = (req as any).user.userId;

    if (!content || !characterId) {
      return res.status(400).json({ error: 'El contenido y personaje son requeridos' });
    }

    // Verificar que el personaje pertenece al usuario
    const [characters] = await db.query(
      'SELECT id FROM players WHERE id = ? AND account_id = ? AND deleted = 0',
      [characterId, userId]
    ) as any[];

    if (characters.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para comentar con este personaje' });
    }

    // Verificar que el tema existe y no está bloqueado
    const [topics] = await db.query(
      'SELECT is_locked FROM forum_topics WHERE id = ?',
      [topicId]
    ) as any[];

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    if (topics[0].is_locked) {
      return res.status(403).json({ error: 'Este tema está cerrado y no admite más comentarios' });
    }

    const [result] = await db.query(
      'INSERT INTO forum_comments (topic_id, author_id, character_id, content) VALUES (?, ?, ?, ?)',
      [topicId, userId, characterId, content]
    ) as any;

    // Actualizar el updated_at del tema
    await db.query(
      'UPDATE forum_topics SET updated_at = NOW() WHERE id = ?',
      [topicId]
    );

    res.status(201).json({
      success: true,
      message: 'Comentario agregado',
      commentId: result.insertId
    });
  } catch (error) {
    console.error('Error agregando comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DEL FORO (para moderadores)
// ============================================

/** Eliminar tema */
export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    await db.query('DELETE FROM forum_topics WHERE id = ?', [topicId]);

    res.json({ success: true, message: 'Tema eliminado' });
  } catch (error) {
    console.error('Error eliminando tema:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Bloquear/desbloquear tema */
export const toggleLockTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    const [topics] = await db.query(
      'SELECT is_locked FROM forum_topics WHERE id = ?',
      [topicId]
    ) as any[];

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    const newLockState = !topics[0].is_locked;

    await db.query(
      'UPDATE forum_topics SET is_locked = ? WHERE id = ?',
      [newLockState, topicId]
    );

    res.json({
      success: true,
      message: newLockState ? 'Tema bloqueado' : 'Tema desbloqueado',
      isLocked: newLockState
    });
  } catch (error) {
    console.error('Error cambiando estado de bloqueo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Fijar/desfijar tema */
export const togglePinTopic = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    const [topics] = await db.query(
      'SELECT is_pinned FROM forum_topics WHERE id = ?',
      [topicId]
    ) as any[];

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Tema no encontrado' });
    }

    const newPinState = !topics[0].is_pinned;

    await db.query(
      'UPDATE forum_topics SET is_pinned = ? WHERE id = ?',
      [newPinState, topicId]
    );

    res.json({
      success: true,
      message: newPinState ? 'Tema fijado' : 'Tema desfijado',
      isPinned: newPinState
    });
  } catch (error) {
    console.error('Error cambiando estado de fijado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar comentario */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    await db.query('DELETE FROM forum_comments WHERE id = ?', [commentId]);

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
