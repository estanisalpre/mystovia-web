import { Router } from 'express';
import {
  getDownloads,
  registerDownload,
  createDownload,
  updateDownload,
  deleteDownload,
  getAllDownloadsAdmin,
  getDownloadCategories
} from '../controllers/downloadsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================
router.get('/', getDownloads);
router.get('/categories', getDownloadCategories);
router.post('/:downloadId/register', registerDownload);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/all', authenticateToken, checkPermission(['manage_downloads']), getAllDownloadsAdmin);
router.post('/admin/create', authenticateToken, checkPermission(['manage_downloads']), createDownload);
router.put('/admin/:downloadId', authenticateToken, checkPermission(['manage_downloads']), updateDownload);
router.delete('/admin/:downloadId', authenticateToken, checkPermission(['manage_downloads']), deleteDownload);

export default router;
