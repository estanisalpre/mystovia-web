import { Router } from 'express';
import {
  getWikiCategories,
  getArticlesByCategory,
  getArticleBySlug,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getAllArticlesAdmin
} from '../controllers/wikiController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/categories', getWikiCategories);
router.get('/categories/:categorySlug/articles', getArticlesByCategory);
router.get('/articles/:slug', getArticleBySlug);
router.get('/search', searchArticles);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/all', authenticateToken, checkPermission(['manage_wiki']), getAllArticlesAdmin);
router.post('/admin/create', authenticateToken, checkPermission(['manage_wiki']), createArticle);
router.put('/admin/:articleId', authenticateToken, checkPermission(['manage_wiki']), updateArticle);
router.delete('/admin/:articleId', authenticateToken, checkPermission(['manage_wiki']), deleteArticle);

export default router;
