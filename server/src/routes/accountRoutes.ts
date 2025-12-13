import { Router } from 'express';
import {
  getAccountDetails,
  changePassword,
  changeEmail
} from '../controllers/accountController.js';

const router = Router();

router.get('/details', getAccountDetails);
router.post('/change-password', changePassword);
router.post('/change-email', changeEmail);

export default router;
