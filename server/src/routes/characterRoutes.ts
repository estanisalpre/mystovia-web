import { Router } from 'express';
import { createCharacter, getCharacters } from '../controllers/characterController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticateToken, createCharacter);
router.get('/', authenticateToken, getCharacters);

export default router;