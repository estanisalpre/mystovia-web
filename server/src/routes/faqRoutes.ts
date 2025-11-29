import { Router } from 'express';
import {
  getFAQs,
  searchFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllFAQsAdmin,
  getFAQCategories
} from '../controllers/faqController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/', getFAQs);
router.get('/search', searchFAQs);
router.get('/categories', getFAQCategories);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/all', authenticateToken, checkPermission(['manage_faqs']), getAllFAQsAdmin);
router.post('/admin/create', authenticateToken, checkPermission(['manage_faqs']), createFAQ);
router.put('/admin/:faqId', authenticateToken, checkPermission(['manage_faqs']), updateFAQ);
router.delete('/admin/:faqId', authenticateToken, checkPermission(['manage_faqs']), deleteFAQ);

export default router;
