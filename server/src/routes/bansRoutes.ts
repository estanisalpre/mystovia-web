import { Router } from 'express';
import { getActiveBans } from '../controllers/bansController.js';

const router = Router();

// GET /api/bans
// Query params: limit (default: 50, max: 100)
router.get('/', getActiveBans);

export default router;
