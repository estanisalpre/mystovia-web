import { Router } from 'express';
import { getServerStats, getOnlinePlayers } from '../controllers/serverController.js';

const router = Router();

router.get('/stats', getServerStats);
router.get('/online', getOnlinePlayers);

export default router;