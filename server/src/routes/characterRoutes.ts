import { Router } from 'express';
import { createCharacter, getCharacters, searchCharacter } from '../controllers/characterController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticateToken, createCharacter);
router.get('/', authenticateToken, getCharacters);
router.get('/search', searchCharacter);

export default router;