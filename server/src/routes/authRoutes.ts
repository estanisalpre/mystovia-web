import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyUser,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  findAccount,
  verifyRecoveryKey,
  recoveryResetPassword,
  recoveryChangeEmail
} from '../controllers/authController.js';
// import { authenticateToken } from '../middleware/authMiddleware.js'; // JWT COMENTADO - No se usa por ahora

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);

router.get('/verify', verifyUser);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/find-account', findAccount);
router.post('/verify-recovery-key', verifyRecoveryKey);
router.post('/recovery-reset-password', recoveryResetPassword);
router.post('/recovery-change-email', recoveryChangeEmail);

export default router;