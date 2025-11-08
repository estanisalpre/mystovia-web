import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyUser
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.get('/verify', authenticateToken, verifyUser);

export default router;