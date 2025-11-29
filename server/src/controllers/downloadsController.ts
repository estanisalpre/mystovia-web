import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// DESCARGAS PÚBLICAS
// ============================================

/** Obtener todas las descargas agrupadas por categoría */
export const getDownloads = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      `SELECT
        dc.id,
        dc.name,
        dc.description,
        dc.order_position
      FROM download_categories dc
      ORDER BY dc.order_position ASC`
    ) as any[];

    // Obtener descargas para cada categoría
    const categoriesWithDownloads = await Promise.all(
      categories.map(async (category: any) => {
        const [downloads] = await db.query(
          `SELECT
            id,
            name,
            description,
            version,
            file_url,
            file_size,
            download_count,
            created_at,
            updated_at
           FROM downloads
           WHERE category_id = ? AND is_active = 1
           ORDER BY created_at DESC`,
          [category.id]
        ) as any[];

        return {
          ...category,
          downloads
        };
      })
    );

    res.json({ success: true, categories: categoriesWithDownloads });
  } catch (error) {
    console.error('Error obteniendo descargas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Registrar una descarga (incrementar contador) */
export const registerDownload = async (req: Request, res: Response) => {
  try {
    const { downloadId } = req.params;

    await db.query(
      'UPDATE downloads SET download_count = download_count + 1 WHERE id = ?',
      [downloadId]
    );

    res.json({ success: true, message: 'Descarga registrada' });
  } catch (error) {
    console.error('Error registrando descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE DESCARGAS
// ============================================

/** Crear una nueva descarga (admin) */
export const createDownload = async (req: Request, res: Response) => {
  try {
    const { categoryId, name, description, version, fileUrl, fileSize } = req.body;

    if (!name || !fileUrl) {
      return res.status(400).json({ error: 'Nombre y URL son requeridos' });
    }

    const [result] = await db.query(
      `INSERT INTO downloads (category_id, name, description, version, file_url, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [categoryId, name, description, version, fileUrl, fileSize]
    ) as any;

    res.status(201).json({
      success: true,
      message: 'Descarga creada exitosamente',
      downloadId: result.insertId
    });
  } catch (error) {
    console.error('Error creando descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar una descarga (admin) */
export const updateDownload = async (req: Request, res: Response) => {
  try {
    const { downloadId } = req.params;
    const { categoryId, name, description, version, fileUrl, fileSize, isActive } = req.body;

    if (!name || !fileUrl) {
      return res.status(400).json({ error: 'Nombre y URL son requeridos' });
    }

    await db.query(
      `UPDATE downloads
       SET category_id = ?, name = ?, description = ?, version = ?, file_url = ?, file_size = ?, is_active = ?
       WHERE id = ?`,
      [categoryId, name, description, version, fileUrl, fileSize, isActive ? 1 : 0, downloadId]
    );

    res.json({ success: true, message: 'Descarga actualizada' });
  } catch (error) {
    console.error('Error actualizando descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar una descarga (admin) */
export const deleteDownload = async (req: Request, res: Response) => {
  try {
    const { downloadId } = req.params;

    await db.query('DELETE FROM downloads WHERE id = ?', [downloadId]);

    res.json({ success: true, message: 'Descarga eliminada' });
  } catch (error) {
    console.error('Error eliminando descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todas las descargas (incluidas las inactivas) - Admin */
export const getAllDownloadsAdmin = async (_req: Request, res: Response) => {
  try {
    const [downloads] = await db.query(
      `SELECT
        d.id,
        d.name,
        d.description,
        d.version,
        d.file_url,
        d.file_size,
        d.download_count,
        d.is_active,
        d.created_at,
        d.updated_at,
        dc.name as category_name
      FROM downloads d
      INNER JOIN download_categories dc ON d.category_id = dc.id
      ORDER BY d.created_at DESC`
    ) as any[];

    res.json({ success: true, downloads });
  } catch (error) {
    console.error('Error obteniendo descargas (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener categorías de descargas */
export const getDownloadCategories = async (_req: Request, res: Response) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM download_categories ORDER BY order_position ASC'
    ) as any[];

    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error obteniendo categorías de descargas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
