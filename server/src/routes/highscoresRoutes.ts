import { Router } from 'express';
import { getHighscores } from '../controllers/highscoresController.js';

const router = Router();

// GET /api/highscores
// Query params: page, limit, vocation, category
router.get('/', getHighscores);

export default router;
