import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// WIKI PÚBLICA
// ============================================

/** Obtener todas las categorías de la wiki */
export const getWikiCategories = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      `SELECT
        wc.id,
        wc.name,
        wc.slug,
        wc.description,
        COUNT(wa.id) as articles_count
      FROM wiki_categories wc
      LEFT JOIN wiki_articles wa ON wc.id = wa.category_id AND wa.is_published = 1
      GROUP BY wc.id
      ORDER BY wc.order_position ASC`
    ) as any[];

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías de wiki:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener artículos por categoría */
export const getArticlesByCategory = async (req: Request, res: Response) => {
  try {
    const { categorySlug } = req.params;

    const [articles] = await db.query(
      `SELECT
        wa.id,
        wa.title,
        wa.slug,
        wa.content,
        wa.views_count,
        wa.created_at,
        wa.updated_at,
        a.name as author_name
      FROM wiki_articles wa
      INNER JOIN wiki_categories wc ON wa.category_id = wc.id
      INNER JOIN accounts a ON wa.author_id = a.id
      WHERE wc.slug = ? AND wa.is_published = 1
      ORDER BY wa.title ASC`,
      [categorySlug]
    ) as any[];

    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error obteniendo artículos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener un artículo específico por slug */
export const getArticleBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Incrementar contador de vistas
    await db.query(
      'UPDATE wiki_articles SET views_count = views_count + 1 WHERE slug = ? AND is_published = 1',
      [slug]
    );

    const [articles] = await db.query(
      `SELECT
        wa.id,
        wa.title,
        wa.slug,
        wa.content,
        wa.views_count,
        wa.created_at,
        wa.updated_at,
        wa.author_id,
        a.name as author_name,
        wc.name as category_name,
        wc.slug as category_slug
      FROM wiki_articles wa
      INNER JOIN accounts a ON wa.author_id = a.id
      LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
      WHERE wa.slug = ? AND wa.is_published = 1`,
      [slug]
    ) as any[];

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    res.json({ success: true, article: articles[0] });
  } catch (error) {
    console.error('Error obteniendo artículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Buscar artículos */
export const searchArticles = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query de búsqueda requerido' });
    }

    const searchTerm = `%${query}%`;

    const [articles] = await db.query(
      `SELECT
        wa.id,
        wa.title,
        wa.slug,
        SUBSTRING(wa.content, 1, 200) as excerpt,
        wa.views_count,
        a.name as author_name,
        wc.name as category_name,
        wc.slug as category_slug
      FROM wiki_articles wa
      INNER JOIN accounts a ON wa.author_id = a.id
      LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
      WHERE wa.is_published = 1 AND (wa.title LIKE ? OR wa.content LIKE ?)
      ORDER BY wa.title ASC
      LIMIT 20`,
      [searchTerm, searchTerm]
    ) as any[];

    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error buscando artículos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE WIKI
// ============================================

/** Crear un nuevo artículo (admin) */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { categoryId, title, slug, content, isPublished } = req.body;
    const userId = (req as any).user.userId;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Título, slug y contenido son requeridos' });
    }

    // Verificar que el slug no exista
    const [existingSlugs] = await db.query(
      'SELECT 1 FROM wiki_articles WHERE slug = ?',
      [slug]
    ) as any[];

    if (existingSlugs.length > 0) {
      return res.status(400).json({ error: 'El slug ya existe' });
    }

    const [result] = await db.query(
      `INSERT INTO wiki_articles (category_id, title, slug, content, author_id, is_published)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [categoryId, title, slug, content, userId, isPublished ? 1 : 0]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Artículo creado exitosamente',
      articleId: result.insertId
    });
  } catch (error) {
    console.error('Error creando artículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar un artículo (admin) */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { categoryId, title, slug, content, isPublished } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Título, slug y contenido son requeridos' });
    }

    // Verificar que el slug no exista en otro artículo
    const [existingSlugs] = await db.query(
      'SELECT 1 FROM wiki_articles WHERE slug = ? AND id != ?',
      [slug, articleId]
    ) as any[];

    if (existingSlugs.length > 0) {
      return res.status(400).json({ error: 'El slug ya existe' });
    }

    await db.query(
      `UPDATE wiki_articles
       SET category_id = ?, title = ?, slug = ?, content = ?, is_published = ?
       WHERE id = ?`,
      [categoryId, title, slug, content, isPublished ? 1 : 0, articleId]
    );

    res.json({ success: true, message: 'Artículo actualizado' });
  } catch (error) {
    console.error('Error actualizando artículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar un artículo (admin) */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    await db.query('DELETE FROM wiki_articles WHERE id = ?', [articleId]);

    res.json({ success: true, message: 'Artículo eliminado' });
  } catch (error) {
    console.error('Error eliminando artículo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todos los artículos (incluidos los no publicados) - Admin */
export const getAllArticlesAdmin = async (req: Request, res: Response) => {
  try {
    const [articles] = await db.query(
      `SELECT
        wa.id,
        wa.title,
        wa.slug,
        wa.is_published,
        wa.views_count,
        wa.created_at,
        wa.updated_at,
        a.name as author_name,
        wc.name as category_name
      FROM wiki_articles wa
      INNER JOIN accounts a ON wa.author_id = a.id
      LEFT JOIN wiki_categories wc ON wa.category_id = wc.id
      ORDER BY wa.updated_at DESC`
    ) as any[];

    res.json({ success: true, articles });
  } catch (error) {
    console.error('Error obteniendo artículos (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
