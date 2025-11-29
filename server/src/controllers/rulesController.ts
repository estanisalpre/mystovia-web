import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// REGLAS PÚBLICAS
// ============================================

/** Obtener todas las reglas agrupadas por sección */
export const getRules = async (_req: Request, res: Response) => {
  try {
    const [sections] = await db.query(
      `SELECT
        rs.id,
        rs.name,
        rs.order_position
      FROM rule_sections rs
      ORDER BY rs.order_position ASC`
    ) as any[];

    // Obtener reglas para cada sección
    const sectionsWithRules = await Promise.all(
      sections.map(async (section: any) => {
        const [rules] = await db.query(
          `SELECT id, title, content, order_position
           FROM rules
           WHERE section_id = ? AND is_active = 1
           ORDER BY order_position ASC`,
          [section.id]
        ) as any[];

        return {
          ...section,
          rules
        };
      })
    );

    res.json({ success: true, sections: sectionsWithRules });
  } catch (error) {
    console.error('Error obteniendo reglas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE REGLAS
// ============================================

/** Crear una nueva regla (admin) */
export const createRule = async (req: Request, res: Response) => {
  try {
    const { sectionId, title, content, orderPosition } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO rules (section_id, title, content, order_position)
       VALUES (?, ?, ?, ?)`,
      [sectionId, title, content, orderPosition || 0]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Regla creada exitosamente',
      ruleId: result.insertId
    });
  } catch (error) {
    console.error('Error creando regla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar una regla (admin) */
export const updateRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const { sectionId, title, content, orderPosition, isActive } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    await db.query(
      `UPDATE rules
       SET section_id = ?, title = ?, content = ?, order_position = ?, is_active = ?
       WHERE id = ?`,
      [sectionId, title, content, orderPosition || 0, isActive ? 1 : 0, ruleId]
    );

    res.json({ success: true, message: 'Regla actualizada' });
  } catch (error) {
    console.error('Error actualizando regla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar una regla (admin) */
export const deleteRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    await db.query('DELETE FROM rules WHERE id = ?', [ruleId]);

    res.json({ success: true, message: 'Regla eliminada' });
  } catch (error) {
    console.error('Error eliminando regla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todas las reglas (incluidas las inactivas) - Admin */
export const getAllRulesAdmin = async (_req: Request, res: Response) => {
  try {
    const [rules] = await db.query(
      `SELECT
        r.id,
        r.title,
        r.content,
        r.order_position,
        r.is_active,
        r.created_at,
        r.updated_at,
        rs.name as section_name
      FROM rules r
      INNER JOIN rule_sections rs ON r.section_id = rs.id
      ORDER BY rs.order_position, r.order_position ASC`
    ) as any[];

    res.json({ success: true, rules });
  } catch (error) {
    console.error('Error obteniendo reglas (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener secciones de reglas */
export const getRuleSections = async (_req: Request, res: Response) => {
  try {
    const [sections] = await db.query(
      'SELECT * FROM rule_sections ORDER BY order_position ASC'
    ) as any[];

    res.json({ success: true, sections });
  } catch (error) {
    console.error('Error obteniendo secciones de reglas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
