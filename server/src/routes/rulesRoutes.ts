import { Router } from 'express';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAllRulesAdmin,
  getRuleSections
} from '../controllers/rulesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/', getRules);
router.get('/sections', getRuleSections);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/all', authenticateToken, checkPermission(['manage_rules']), getAllRulesAdmin);
router.post('/admin/create', authenticateToken, checkPermission(['manage_rules']), createRule);
router.put('/admin/:ruleId', authenticateToken, checkPermission(['manage_rules']), updateRule);
router.delete('/admin/:ruleId', authenticateToken, checkPermission(['manage_rules']), deleteRule);

export default router;
