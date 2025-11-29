import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// FAQS PÚBLICAS
// ============================================

/** Obtener todas las FAQs agrupadas por categoría */
export const getFAQs = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      `SELECT
        fc.id,
        fc.name,
        fc.order_position
      FROM faq_categories fc
      ORDER BY fc.order_position ASC`
    ) as any[];

    // Obtener FAQs para cada categoría
    const categoriesWithFAQs = await Promise.all(
      categories.map(async (category: any) => {
        const [faqs] = await db.query(
          `SELECT id, question, answer, order_position
           FROM faqs
           WHERE category_id = ? AND is_active = 1
           ORDER BY order_position ASC`,
          [category.id]
        ) as any[];

        return {
          ...category,
          faqs
        };
      })
    );

    res.json({ success: true, categories: categoriesWithFAQs });
  } catch (error) {
    console.error('Error obteniendo FAQs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Buscar FAQs */
export const searchFAQs = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query de búsqueda requerido' });
    }

    const searchTerm = `%${query}%`;

    const [faqs] = await db.query(
      `SELECT
        f.id,
        f.question,
        f.answer,
        fc.name as category_name
      FROM faqs f
      INNER JOIN faq_categories fc ON f.category_id = fc.id
      WHERE f.is_active = 1 AND (f.question LIKE ? OR f.answer LIKE ?)
      ORDER BY f.order_position ASC
      LIMIT 20`,
      [searchTerm, searchTerm]
    ) as any[];

    res.json({ success: true, faqs });
  } catch (error) {
    console.error('Error buscando FAQs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE FAQS
// ============================================

/** Crear una nueva FAQ (admin) */
export const createFAQ = async (req: Request, res: Response) => {
  try {
    const { categoryId, question, answer, orderPosition } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Pregunta y respuesta son requeridas' });
    }

    const [result] = await db.query(
      `INSERT INTO faqs (category_id, question, answer, order_position)
       VALUES (?, ?, ?, ?)`,
      [categoryId, question, answer, orderPosition || 0]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'FAQ creada exitosamente',
      faqId: result.insertId
    });
  } catch (error) {
    console.error('Error creando FAQ:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar una FAQ (admin) */
export const updateFAQ = async (req: Request, res: Response) => {
  try {
    const { faqId } = req.params;
    const { categoryId, question, answer, orderPosition, isActive } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Pregunta y respuesta son requeridas' });
    }

    await db.query(
      `UPDATE faqs
       SET category_id = ?, question = ?, answer = ?, order_position = ?, is_active = ?
       WHERE id = ?`,
      [categoryId, question, answer, orderPosition || 0, isActive ? 1 : 0, faqId]
    );

    res.json({ success: true, message: 'FAQ actualizada' });
  } catch (error) {
    console.error('Error actualizando FAQ:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar una FAQ (admin) */
export const deleteFAQ = async (req: Request, res: Response) => {
  try {
    const { faqId } = req.params;

    await db.query('DELETE FROM faqs WHERE id = ?', [faqId]);

    res.json({ success: true, message: 'FAQ eliminada' });
  } catch (error) {
    console.error('Error eliminando FAQ:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todas las FAQs (incluidas las inactivas) - Admin */
export const getAllFAQsAdmin = async (_req: Request, res: Response) => {
  try {
    const [faqs] = await db.query(
      `SELECT
        f.id,
        f.question,
        f.answer,
        f.order_position,
        f.is_active,
        f.created_at,
        f.updated_at,
        fc.name as category_name
      FROM faqs f
      INNER JOIN faq_categories fc ON f.category_id = fc.id
      ORDER BY fc.order_position, f.order_position ASC`
    ) as any[];

    res.json({ success: true, faqs });
  } catch (error) {
    console.error('Error obteniendo FAQs (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener categorías de FAQs */
export const getFAQCategories = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM faq_categories ORDER BY order_position ASC'
    ) as any[];

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías de FAQs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
