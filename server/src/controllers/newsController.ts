import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// NOTICIAS PÚBLICAS
// ============================================

/** Obtener todas las noticias publicadas */
export const getNews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.categoryId as string;

    let query = `
      SELECT
        n.id,
        n.title,
        n.content,
        n.image_url,
        n.views_count,
        n.published_at,
        n.author_id,
        a.name as author_name,
        nc.name as category_name,
        nc.slug as category_slug,
        (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as likes_count
      FROM news n
      INNER JOIN accounts a ON n.author_id = a.id
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.is_published = 1
    `;

    const params: any[] = [];

    if (categoryId) {
      query += ' AND n.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY n.published_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [news] = await db.query(query, params) as any[];

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM news WHERE is_published = 1';
    const countParams: any[] = [];

    if (categoryId) {
      countQuery += ' AND category_id = ?';
      countParams.push(categoryId);
    }

    const [countResult] = await db.query(countQuery, countParams) as any[];

    res.json({
      success: true,
      news,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo noticias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener una noticia específica */
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const userId = (req as any).user?.userId;

    // Incrementar contador de vistas
    await db.query(
      'UPDATE news SET views_count = views_count + 1 WHERE id = ?',
      [newsId]
    );

    const [news] = await db.query(
      `SELECT
        n.id,
        n.title,
        n.content,
        n.image_url,
        n.views_count,
        n.published_at,
        n.author_id,
        a.name as author_name,
        nc.name as category_name,
        nc.slug as category_slug,
        (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as likes_count
      FROM news n
      INNER JOIN accounts a ON n.author_id = a.id
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      WHERE n.id = ? AND n.is_published = 1`,
      [newsId]
    ) as any[];

    if (news.length === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    // Verificar si el usuario le dio like
    let userLiked = false;
    if (userId) {
      const [likes] = await db.query(
        'SELECT 1 FROM news_likes WHERE news_id = ? AND user_id = ?',
        [newsId, userId]
      ) as any[];
      userLiked = likes.length > 0;
    }

    res.json({
      success: true,
      news: { ...news[0], userLiked }
    });
  } catch (error) {
    console.error('Error obteniendo noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Dar like a una noticia */
export const likeNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const userId = (req as any).user.userId;

    // Verificar si ya le dio like
    const [existingLikes] = await db.query(
      'SELECT 1 FROM news_likes WHERE news_id = ? AND user_id = ?',
      [newsId, userId]
    ) as any[];

    if (existingLikes.length > 0) {
      // Remover like
      await db.query(
        'DELETE FROM news_likes WHERE news_id = ? AND user_id = ?',
        [newsId, userId]
      );
      return res.json({ success: true, message: 'Like removido', liked: false });
    }

    // Agregar like
    await db.query(
      'INSERT INTO news_likes (news_id, user_id) VALUES (?, ?)',
      [newsId, userId]
    );

    res.json({ success: true, message: 'Like registrado', liked: true });
  } catch (error) {
    console.error('Error dando like:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener categorías de noticias */
export const getNewsCategories = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM news_categories ORDER BY name ASC'
    ) as any[];

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE NOTICIAS
// ============================================

/** Crear una nueva noticia (admin) */
export const createNews = async (req: Request, res: Response) => {
  try {
    const { categoryId, title, content, imageUrl, isPublished } = req.body;
    const userId = (req as any).user.userId;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    const publishedAt = isPublished ? new Date() : null;

    const [result] = await db.query(
      `INSERT INTO news (category_id, author_id, title, content, image_url, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, userId, title, content, imageUrl, isPublished ? 1 : 0, publishedAt]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Noticia creada exitosamente',
      newsId: result.insertId
    });
  } catch (error) {
    console.error('Error creando noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar una noticia (admin) */
export const updateNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const { categoryId, title, content, imageUrl, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    // Si se está publicando por primera vez, establecer published_at
    let updateQuery = `
      UPDATE news
      SET category_id = ?, title = ?, content = ?, image_url = ?, is_published = ?
    `;
    const params: any[] = [categoryId, title, content, imageUrl, isPublished ? 1 : 0];

    if (isPublished) {
      updateQuery += ', published_at = IFNULL(published_at, NOW())';
    }

    updateQuery += ' WHERE id = ?';
    params.push(newsId);

    await db.query(updateQuery, params);

    res.json({ success: true, message: 'Noticia actualizada' });
  } catch (error) {
    console.error('Error actualizando noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar una noticia (admin) */
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;

    await db.query('DELETE FROM news WHERE id = ?', [newsId]);

    res.json({ success: true, message: 'Noticia eliminada' });
  } catch (error) {
    console.error('Error eliminando noticia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todas las noticias (incluidas las no publicadas) - Admin */
export const getAllNewsAdmin = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [news] = await db.query(
      `SELECT
        n.id,
        n.title,
        n.content,
        n.image_url,
        n.is_published,
        n.views_count,
        n.created_at,
        n.published_at,
        a.name as author_name,
        nc.name as category_name,
        (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id) as likes_count
      FROM news n
      INNER JOIN accounts a ON n.author_id = a.id
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    ) as any[];

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM news'
    ) as any[];

    res.json({
      success: true,
      news,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo noticias (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
