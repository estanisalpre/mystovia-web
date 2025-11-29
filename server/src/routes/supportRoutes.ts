import { Router } from 'express';
import {
  createSupportTicket,
  getUserTickets,
  getTicketById,
  addTicketResponse,
  getAllTicketsAdmin,
  updateTicketStatus,
  deleteTicket
} from '../controllers/supportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// ============================================
// RUTAS PÚBLICAS / PROTEGIDAS
// ============================================
router.post('/tickets', createSupportTicket); // Puede usarse sin autenticación
router.get('/tickets/my', authenticateToken, getUserTickets);
router.get('/tickets/:ticketId', authenticateToken, getTicketById);
router.post('/tickets/:ticketId/responses', authenticateToken, addTicketResponse);

// ============================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos)
// ============================================
router.get('/admin/tickets', authenticateToken, checkPermission(['manage_support']), getAllTicketsAdmin);
router.patch('/admin/tickets/:ticketId', authenticateToken, checkPermission(['manage_support']), updateTicketStatus);
router.delete('/admin/tickets/:ticketId', authenticateToken, checkPermission(['manage_support']), deleteTicket);

export default router;
