/**
 * Sistema de permisos del frontend
 * Verifica si un usuario tiene los permisos necesarios basándose en su group_id
 */

// Definición de roles
export const ROLES = {
  USER: 1,
  GAME_MASTER: 6,
  SUPER_ADMIN: 10,
} as const;

// Mapa de permisos por rol
const ROLE_PERMISSIONS: Record<number, string[]> = {
  // Super Admin - Acceso total
  [ROLES.SUPER_ADMIN]: [
    'view_admin_panel',
    'manage_marketplace',
    'manage_users',
    'manage_forum',
    'manage_news',
    'manage_wiki',
    'manage_downloads',
    'manage_rules',
    'manage_faqs',
    'manage_support',
    'write_forum',
    'vote_forum',
    'like_news',
  ],

  // Game Master - Sin acceso al panel admin
  [ROLES.GAME_MASTER]: [
    'write_forum',
    'vote_forum',
  ],

  // Usuario Normal - Permisos básicos
  [ROLES.USER]: [
    'write_forum',
    'vote_forum',
    'like_news',
  ],
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param groupId - El group_id del usuario
 * @param permission - El permiso a verificar
 * @returns true si el usuario tiene el permiso
 */
export function hasPermission(groupId: number | undefined, permission: string): boolean {
  if (!groupId) return false;

  // Super Admin tiene acceso a todo
  if (groupId === ROLES.SUPER_ADMIN) return true;

  const permissions = ROLE_PERMISSIONS[groupId] || [];
  return permissions.includes(permission);
}

/**
 * Verifica si un usuario tiene alguno de los permisos especificados
 * @param groupId - El group_id del usuario
 * @param permissions - Array de permisos a verificar
 * @returns true si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(groupId: number | undefined, permissions: string[]): boolean {
  if (!groupId) return false;

  return permissions.some(permission => hasPermission(groupId, permission));
}

/**
 * Verifica si un usuario tiene todos los permisos especificados
 * @param groupId - El group_id del usuario
 * @param permissions - Array de permisos a verificar
 * @returns true si el usuario tiene todos los permisos
 */
export function hasAllPermissions(groupId: number | undefined, permissions: string[]): boolean {
  if (!groupId) return false;

  return permissions.every(permission => hasPermission(groupId, permission));
}

/**
 * Verifica si un usuario es Super Admin
 */
export function isSuperAdmin(groupId: number | undefined): boolean {
  return groupId === ROLES.SUPER_ADMIN;
}

/**
 * Verifica si un usuario es Game Master
 */
export function isGameMaster(groupId: number | undefined): boolean {
  return groupId === ROLES.GAME_MASTER || isSuperAdmin(groupId);
}

/**
 * Verifica si un usuario tiene acceso al panel de administración
 */
export function canAccessAdminPanel(groupId: number | undefined): boolean {
  return hasPermission(groupId, 'view_admin_panel');
}

/**
 * Obtiene el nombre del rol basado en el group_id
 */
export function getRoleName(groupId: number | undefined): string {
  switch (groupId) {
    case ROLES.SUPER_ADMIN:
      return 'Super Admin';
    case ROLES.GAME_MASTER:
      return 'Game Master';
    case ROLES.USER:
      return 'Usuario';
    default:
      return 'Desconocido';
  }
}

/**
 * Obtiene el color badge del rol
 */
export function getRoleColor(groupId: number | undefined): string {
  switch (groupId) {
    case ROLES.SUPER_ADMIN:
      return 'bg-red-500';
    case ROLES.GAME_MASTER:
      return 'bg-blue-500';
    case ROLES.USER:
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}
