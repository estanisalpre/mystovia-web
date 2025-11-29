import { Router } from 'express';
import {
  getNews,
  getNewsById,
  likeNews,
  getNewsCategories,
  createNews,
  updateNews,
  deleteNews,
  getAllNewsAdmin
} from '../controllers/newsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/', getNews);
router.get('/categories', getNewsCategories);
router.get('/:newsId', getNewsById);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================
router.post('/:newsId/like', authenticateToken, checkPermission(['like_news']), likeNews);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/all', authenticateToken, checkPermission(['manage_news']), getAllNewsAdmin);
router.post('/admin/create', authenticateToken, checkPermission(['manage_news']), createNews);
router.put('/admin/:newsId', authenticateToken, checkPermission(['manage_news']), updateNews);
router.delete('/admin/:newsId', authenticateToken, checkPermission(['manage_news']), deleteNews);

export default router;
