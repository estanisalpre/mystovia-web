import { Router } from 'express';
import { getLatestDeaths } from '../controllers/deathsController.js';

const router = Router();

// GET /api/deaths/latest
// Query params: limit (default: 10, max: 100)
router.get('/latest', getLatestDeaths);

export default router;
