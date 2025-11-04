import { Router } from 'express';
import { createCharacter, getCharacters } from '../controllers/characterController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/create', authenticateToken, createCharacter);
router.get('/', authenticateToken, getCharacters);

export default router;