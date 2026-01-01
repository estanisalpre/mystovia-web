import { Router } from 'express';
import {
  getTwitchAuthUrl,
  handleTwitchCallback,
  disconnectTwitch,
  getMyStreamingAccounts,
  getLiveStreams,
  refreshLiveStatus
} from '../controllers/twitchController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Get live streams (for homepage)
router.get('/live', getLiveStreams);

// Twitch OAuth callback (Twitch redirects here)
router.get('/callback', handleTwitchCallback);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Get Twitch OAuth URL to start connection
router.get('/auth-url', authenticateToken, getTwitchAuthUrl);

// Disconnect Twitch account
router.delete('/disconnect', authenticateToken, disconnectTwitch);

// Get user's connected streaming accounts
router.get('/my-accounts', authenticateToken, getMyStreamingAccounts);

// ============================================
// RUTAS DE ADMINISTRACIÓN / SISTEMA
// ============================================

// Refresh live status (can be called by cron job)
router.post('/refresh-status', refreshLiveStatus);

export default router;
