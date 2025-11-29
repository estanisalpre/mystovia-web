import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyUser
} from '../controllers/authController.js';
// import { authenticateToken } from '../middleware/authMiddleware.js'; // JWT COMENTADO - No se usa por ahora

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);

// Verify route - ahora verifyUser maneja su propia autenticación (sin JWT)
router.get('/verify', verifyUser);

export default router;