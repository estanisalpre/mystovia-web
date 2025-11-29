import { Request, Response } from 'express';
import db from '../config/database.js';
import nodemailer from 'nodemailer';

// ============================================
// CONFIGURACIÓN DE EMAIL
// ============================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ============================================
// TICKETS DE SOPORTE
// ============================================

/** Crear un nuevo ticket de soporte */
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = (req as any).user?.userId;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Nombre, email, asunto y mensaje son requeridos'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const [result] = await db.query(
      `INSERT INTO support_tickets (user_id, name, email, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, name, email, subject, message]
    ) as any;

    const ticketId = result.insertId;

    // Enviar email de confirmación al usuario
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: `Ticket #${ticketId} - ${subject}`,
        html: `
          <h2>Ticket de Soporte Recibido</h2>
          <p>Hola ${name},</p>
          <p>Hemos recibido tu solicitud de soporte. Te responderemos lo antes posible.</p>
          <p><strong>Número de Ticket:</strong> #${ticketId}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${message}</p>
          <br>
          <p>Saludos,<br>Equipo de Soporte</p>
        `
      });
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
      // No fallar la creación del ticket si falla el email
    }

    // Notificar al equipo de soporte
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
        subject: `Nuevo Ticket de Soporte #${ticketId}`,
        html: `
          <h2>Nuevo Ticket de Soporte</h2>
          <p><strong>Ticket ID:</strong> #${ticketId}</p>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Asunto:</strong> ${subject}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${message}</p>
        `
      });
    } catch (emailError) {
      console.error('Error notificando al equipo de soporte:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Ticket creado exitosamente. Te contactaremos pronto.',
      ticketId
    });
  } catch (error) {
    console.error('Error creando ticket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener tickets del usuario autenticado */
export const getUserTickets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [tickets] = await db.query(
      `SELECT
        id,
        subject,
        message,
        status,
        priority,
        created_at,
        updated_at
      FROM support_tickets
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    ) as any[];

    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error obteniendo tickets del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Obtener un ticket específico con sus respuestas */
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user?.userId;

    // Obtener el ticket
    const [tickets] = await db.query(
      `SELECT
        st.id,
        st.user_id,
        st.name,
        st.email,
        st.subject,
        st.message,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      WHERE st.id = ?`,
      [ticketId]
    ) as any[];

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = tickets[0];

    // Verificar permisos: solo el dueño o staff pueden ver el ticket
    const userPermissions = (req as any).userPermissions || [];
    const canManageSupport = userPermissions.includes('manage_support');

    if (!canManageSupport && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
    }

    // Obtener respuestas
    const [responses] = await db.query(
      `SELECT
        sr.id,
        sr.message,
        sr.is_staff_response,
        sr.created_at,
        a.name as responder_name
      FROM support_responses sr
      LEFT JOIN accounts a ON sr.responder_id = a.id
      WHERE sr.ticket_id = ?
      ORDER BY sr.created_at ASC`,
      [ticketId]
    ) as any[];

    res.json({ success: true, ticket, responses });
  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Agregar una respuesta a un ticket */
export const addTicketResponse = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = (req as any).user.userId;
    const userPermissions = (req as any).userPermissions || [];

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    // Verificar que el ticket existe
    const [tickets] = await db.query(
      'SELECT user_id, email, subject FROM support_tickets WHERE id = ?',
      [ticketId]
    ) as any[];

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticket = tickets[0];
    const isStaffResponse = userPermissions.includes('manage_support');

    // Verificar permisos: solo el dueño o staff pueden responder
    if (!isStaffResponse && ticket.user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para responder este ticket' });
    }

    const [result] = await db.query(
      `INSERT INTO support_responses (ticket_id, responder_id, message, is_staff_response)
       VALUES (?, ?, ?, ?)`,
      [ticketId, userId, message, isStaffResponse ? 1 : 0]
    ) as any;

    // Actualizar el estado del ticket si es respuesta del staff
    if (isStaffResponse) {
      await db.query(
        `UPDATE support_tickets SET status = 'in_progress' WHERE id = ?`,
        [ticketId]
      );

      // Enviar email al usuario notificando la respuesta
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: ticket.email,
          subject: `Respuesta a tu Ticket #${ticketId} - ${ticket.subject}`,
          html: `
            <h2>Nueva Respuesta a tu Ticket</h2>
            <p>Hemos respondido a tu ticket de soporte.</p>
            <p><strong>Número de Ticket:</strong> #${ticketId}</p>
            <p><strong>Respuesta:</strong></p>
            <p>${message}</p>
            <br>
            <p>Saludos,<br>Equipo de Soporte</p>
          `
        });
      } catch (emailError) {
        console.error('Error enviando email de respuesta:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Respuesta agregada',
      responseId: result.insertId
    });
  } catch (error) {
    console.error('Error agregando respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ============================================
// ADMINISTRACIÓN DE SOPORTE
// ============================================

/** Obtener todos los tickets (admin) */
export const getAllTicketsAdmin = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    let query = `
      SELECT
        st.id,
        st.name,
        st.email,
        st.subject,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at,
        (SELECT COUNT(*) FROM support_responses WHERE ticket_id = st.id) as responses_count
      FROM support_tickets st
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ' AND st.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND st.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY st.created_at DESC';

    const [tickets] = await db.query(query, params) as any[];

    res.json({ success: true, tickets });
  } catch (error) {
    console.error('Error obteniendo tickets (admin):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Actualizar el estado de un ticket (admin) */
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status, priority } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Prioridad inválida' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay cambios para aplicar' });
    }

    params.push(ticketId);

    await db.query(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Ticket actualizado' });
  } catch (error) {
    console.error('Error actualizando ticket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** Eliminar un ticket (admin) */
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    await db.query('DELETE FROM support_tickets WHERE id = ?', [ticketId]);

    res.json({ success: true, message: 'Ticket eliminado' });
  } catch (error) {
    console.error('Error eliminando ticket:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
