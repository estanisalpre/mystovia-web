import { Request, Response } from 'express';
import db from '../config/database.js';

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

/** Obtener todos los usuarios con paginación */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = `
      SELECT
        id,
        name,
        email,
        group_id,
        premdays,
        lastday,
        blocked,
        warnings,
        creation
      FROM accounts
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY creation DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await db.query(query, params) as any[];

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM accounts WHERE 1=1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams) as any[];

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener información detallada de un usuario */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      `SELECT
        a.id,
        a.name,
        a.email,
        a.group_id,
        a.premdays,
        a.lastday,
        a.blocked,
        a.warnings,
        a.creation
      FROM accounts a
      WHERE a.id = ?`,
      [userId]
    ) as any[];

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Obtener permisos del usuario
    const [permissions] = await db.query(
      `SELECT p.name, p.description
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.group_id = ?`,
      [user.group_id]
    ) as any[];

    // Obtener personajes del usuario
    const [characters] = await db.query(
      `SELECT
        id,
        name,
        level,
        vocation,
        health,
        healthmax,
        experience,
        maglevel
      FROM players
      WHERE account_id = ?`,
      [userId]
    ) as any[];

    res.json({
      success: true,
      user: {
        ...user,
        permissions,
        characters
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar el rol de un usuario */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.body;

    if (!groupId || typeof groupId !== 'number') {
      return res.status(400).json({ error: 'Group ID es requerido y debe ser un número' });
    }

    // Validar que el group_id tenga permisos asignados
    const [rolePermissions] = await db.query(
      'SELECT 1 FROM role_permissions WHERE group_id = ? LIMIT 1',
      [groupId]
    ) as any[];

    // No es crítico si no hay permisos, puede ser un rol sin permisos especiales

    await db.query(
      'UPDATE accounts SET group_id = ? WHERE id = ?',
      [groupId, userId]
    );

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Bloquear/desbloquear un usuario */
export const toggleUserBlock = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [users] = await db.query(
      'SELECT blocked FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const newBlockedState = users[0].blocked === 1 ? 0 : 1;

    await db.query(
      'UPDATE accounts SET blocked = ? WHERE id = ?',
      [newBlockedState, userId]
    );

    res.json({
      success: true,
      message: newBlockedState === 1 ? 'Usuario bloqueado' : 'Usuario desbloqueado',
      blocked: newBlockedState === 1
    });
  } catch (error) {
    console.error('Error cambiando estado de bloqueo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Agregar días premium a un usuario */
export const addPremiumDays = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days } = req.body;

    if (!days || typeof days !== 'number' || days < 0) {
      return res.status(400).json({ error: 'Días debe ser un número positivo' });
    }

    await db.query(
      'UPDATE accounts SET premdays = premdays + ? WHERE id = ?',
      [days, userId]
    );

    res.json({
      success: true,
      message: `${days} días premium agregados`
    });
  } catch (error) {
    console.error('Error agregando días premium:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar un usuario */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user.userId;

    // Evitar que el usuario se elimine a sí mismo
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    await db.query('DELETE FROM accounts WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'Usuario eliminado'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// GESTIÓN DE ROLES Y PERMISOS
// ============================================

/** Obtener todos los roles disponibles con sus permisos */
export const getRoles = async (_req: Request, res: Response) => {
  try {
    // Obtener todos los group_id únicos de role_permissions
    const [roles] = await db.query(
      `SELECT DISTINCT group_id FROM role_permissions ORDER BY group_id ASC`
    ) as any[];

    const rolesWithPermissions = await Promise.all(
      roles.map(async (role: any) => {
        const [permissions] = await db.query(
          `SELECT p.id, p.name, p.description
           FROM permissions p
           INNER JOIN role_permissions rp ON p.id = rp.permission_id
           WHERE rp.group_id = ?`,
          [role.group_id]
        ) as any[];

        // Obtener conteo de usuarios con este rol
        const [userCount] = await db.query(
          'SELECT COUNT(*) as count FROM accounts WHERE group_id = ?',
          [role.group_id]
        ) as any[];

        // Nombres de roles predefinidos
        const roleNames: { [key: number]: string } = {
          1: 'Usuario Normal',
          6: 'Admin Foro',
          10: 'Super Admin'
        };

        return {
          groupId: role.group_id,
          name: roleNames[role.group_id] || `Rol ${role.group_id}`,
          permissions,
          userCount: userCount[0].count
        };
      })
    );

    res.json({ success: true, roles: rolesWithPermissions });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener todos los permisos disponibles */
export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const [permissions] = await db.query(
      'SELECT id, name, description FROM permissions ORDER BY name ASC'
    ) as any[];

    res.json({ success: true, permissions });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Asignar permisos a un rol */
export const assignPermissionsToRole = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds debe ser un array' });
    }

    // Eliminar permisos existentes del rol
    await db.query('DELETE FROM role_permissions WHERE group_id = ?', [groupId]);

    // Agregar nuevos permisos
    if (permissionIds.length > 0) {
      const values = permissionIds.map(permId => [groupId, permId]);
      await db.query(
        'INSERT INTO role_permissions (group_id, permission_id) VALUES ?',
        [values]
      );
    }

    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente'
    });
  } catch (error) {
    console.error('Error asignando permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ESTADÍSTICAS
// ============================================

/** Obtener estadísticas generales */
export const getStats = async (_req: Request, res: Response) => {
  try {
    // Total de usuarios
    const [totalUsers] = await db.query(
      'SELECT COUNT(*) as total FROM accounts'
    ) as any[];

    // Usuarios por rol
    const [usersByRole] = await db.query(
      `SELECT
        group_id,
        COUNT(*) as count
      FROM accounts
      GROUP BY group_id
      ORDER BY group_id ASC`
    ) as any[];

    // Usuarios activos (últimos 30 días)
    const [activeUsers] = await db.query(
      `SELECT COUNT(*) as total
       FROM accounts
       WHERE lastday >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))`
    ) as any[];

    // Usuarios premium
    const [premiumUsers] = await db.query(
      'SELECT COUNT(*) as total FROM accounts WHERE premdays > 0'
    ) as any[];

    // Usuarios bloqueados
    const [blockedUsers] = await db.query(
      'SELECT COUNT(*) as total FROM accounts WHERE blocked = 1'
    ) as any[];

    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers[0].total,
        activeUsers: activeUsers[0].total,
        premiumUsers: premiumUsers[0].total,
        blockedUsers: blockedUsers[0].total,
        usersByRole
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
