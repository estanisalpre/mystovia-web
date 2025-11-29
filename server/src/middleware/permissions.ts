import { Request, Response, NextFunction } from 'express';
import db from '../config/database.js';

/**
 * Middleware para verificar permisos basados en el sistema de roles
 * @param requiredPermissions - Array de permisos requeridos (OR logic)
 */
export const checkPermission = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        return res.status(401).json({ error: 'No autenticado.' });
      }

      // Obtener el group_id del usuario
      const [users] = await db.query(
        'SELECT group_id FROM accounts WHERE id = ?',
        [user.userId]
      ) as any[];

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const groupId = users[0].group_id;

      // Verificar si el usuario tiene alguno de los permisos requeridos
      const [permissions] = await db.query(
        `SELECT p.name
         FROM permissions p
         INNER JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.group_id = ? AND p.name IN (?)`,
        [groupId, requiredPermissions]
      ) as any[];

      if (permissions.length > 0) {
        // El usuario tiene al menos uno de los permisos requeridos
        (req as any).userGroupId = groupId;
        (req as any).userPermissions = permissions.map((p: any) => p.name);
        return next();
      }

      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción.',
        required: requiredPermissions
      });
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

/**
 * Middleware para verificar si el usuario tiene acceso al panel de administración
 */
export const checkAdminAccess = checkPermission(['view_admin_panel']);

/**
 * Obtiene todos los permisos de un usuario
 */
export const getUserPermissions = async (userId: number): Promise<string[]> => {
  try {
    const [users] = await db.query(
      'SELECT group_id FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!users || users.length === 0) {
      return [];
    }

    const groupId = users[0].group_id;

    const [permissions] = await db.query(
      `SELECT p.name
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.group_id = ?`,
      [groupId]
    ) as any[];

    return permissions.map((p: any) => p.name);
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
};
