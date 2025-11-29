import { Router } from 'express';
import {
  getCategories,
  getTopicsByCategory,
  getTopic,
  createTopic,
  voteTopic,
  addComment,
  deleteTopic,
  toggleLockTopic,
  togglePinTopic,
  deleteComment
} from '../controllers/forumController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/categories', getCategories);
router.get('/categories/:categoryId/topics', getTopicsByCategory);
router.get('/topics/:topicId', getTopic);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================
router.post('/topics', authenticateToken, checkPermission(['write_forum']), createTopic);
router.post('/topics/:topicId/vote', authenticateToken, checkPermission(['vote_forum']), voteTopic);
router.post('/topics/:topicId/comments', authenticateToken, checkPermission(['write_forum']), addComment);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.delete('/topics/:topicId', authenticateToken, checkPermission(['manage_forum']), deleteTopic);
router.patch('/topics/:topicId/lock', authenticateToken, checkPermission(['manage_forum']), toggleLockTopic);
router.patch('/topics/:topicId/pin', authenticateToken, checkPermission(['manage_forum']), togglePinTopic);
router.delete('/comments/:commentId', authenticateToken, checkPermission(['manage_forum']), deleteComment);

export default router;
