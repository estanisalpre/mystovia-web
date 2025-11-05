import { Router } from 'express';
import { getServerStats } from '../controllers/serverController.js';

const router = Router();

router.get('/stats', getServerStats);

export default router;