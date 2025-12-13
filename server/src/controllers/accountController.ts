import { Request, Response } from 'express';
import db from '../config/database.js';

/**
 * 📋 Obtener detalles de la cuenta
 */
export const getAccountDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    const [accounts] = await db.query(
      'SELECT id, email, creation, lastday, premdays FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }

    const account = accounts[0];

    res.json({
      email: account.email,
      createdAt: account.creation ? new Date(account.creation * 1000).toISOString() : null,
      lastLogin: account.lastday ? new Date(account.lastday * 1000).toISOString() : null,
      premdays: account.premdays || 0
    });
  } catch (error) {
    console.error('Error obteniendo detalles de cuenta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 🔐 Cambiar contraseña
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    // Obtener la contraseña actual del usuario
    const [accounts] = await db.query(
      'SELECT password FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }

    const account = accounts[0];

    // Verificar contraseña actual (texto plano por ahora)
    if (currentPassword !== account.password) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    // Actualizar la contraseña
    await db.query(
      'UPDATE accounts SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * 📧 Cambiar email
 */
export const changeEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;
    const { newEmail, currentPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'Nuevo email y contraseña actual son requeridos.' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Obtener la contraseña actual del usuario
    const [accounts] = await db.query(
      'SELECT password FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada.' });
    }

    const account = accounts[0];

    // Verificar contraseña actual (texto plano por ahora)
    if (currentPassword !== account.password) {
      return res.status(401).json({ error: 'La contraseña es incorrecta.' });
    }

    // Verificar si el email ya está en uso
    const [existingEmail] = await db.query(
      'SELECT id FROM accounts WHERE email = ? AND id != ?',
      [newEmail, userId]
    ) as any[];

    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ error: 'Este email ya está en uso.' });
    }

    // Actualizar el email
    await db.query(
      'UPDATE accounts SET email = ? WHERE id = ?',
      [newEmail, userId]
    );

    // Actualizar la cookie del email
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('userEmail', newEmail, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, message: 'Email actualizado correctamente.' });
  } catch (error) {
    console.error('Error cambiando email:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
