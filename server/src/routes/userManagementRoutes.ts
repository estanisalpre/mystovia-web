import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserBlock,
  addPremiumDays,
  deleteUser,
  getRoles,
  getPermissions,
  assignPermissionsToRole,
  getStats
} from '../controllers/userManagementController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// GESTIÓN DE USUARIOS (requiere manage_users)
// ============================================
router.get('/users', authenticateToken, checkPermission(['manage_users']), getUsers);
router.get('/users/:userId', authenticateToken, checkPermission(['manage_users']), getUserById);
router.patch('/users/:userId/role', authenticateToken, checkPermission(['manage_users']), updateUserRole);
router.patch('/users/:userId/block', authenticateToken, checkPermission(['manage_users']), toggleUserBlock);
router.post('/users/:userId/premium', authenticateToken, checkPermission(['manage_users']), addPremiumDays);
router.delete('/users/:userId', authenticateToken, checkPermission(['manage_users']), deleteUser);

// ============================================
// GESTIÓN DE ROLES Y PERMISOS
// ============================================
router.get('/roles', authenticateToken, checkPermission(['manage_users']), getRoles);
router.get('/permissions', authenticateToken, checkPermission(['manage_users']), getPermissions);
router.put('/roles/:groupId/permissions', authenticateToken, checkPermission(['manage_users']), assignPermissionsToRole);

// ============================================
// ESTADÍSTICAS
// ============================================
router.get('/stats', authenticateToken, checkPermission(['view_admin_panel']), getStats);

export default router;
