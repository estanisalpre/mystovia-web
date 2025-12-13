import { Request, Response } from 'express';
import crypto from 'crypto';
// import jwt from 'jsonwebtoken'; // JWT COMENTADO - No se usa por ahora
// import bcrypt from 'bcryptjs'; // BCRYPT COMENTADO - No se usa por ahora
import db from '../config/database.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// 🔧 Configuración global
const isProduction = process.env.NODE_ENV === 'production';
const sameSiteMode: 'none' | 'lax' = isProduction ? 'none' : 'lax';

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/** 🔐 Genera tokens JWT *
const generateTokens = (userId: number, email: string, username: string) => {
  const accessToken = jwt.sign(
    { userId, email, accountName: username },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
*/

/** 🧩 Configuración base para cookies */
const cookieConfig = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteMode,
  domain: isProduction ? undefined : undefined,
  maxAge
});

/** 🔑 Genera una Recovery Key única de 16 caracteres alfanuméricos en mayúscula */
const generateRecoveryKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  const randomBytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) {
    key += chars[randomBytes[i] % chars.length];
  }
  return key;
};

/** 🧍 Registro */
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos.' });

    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    const [existingEmail] = await db.query('SELECT 1 FROM accounts WHERE email = ?', [email]);
    const [existingName] = await db.query('SELECT 1 FROM accounts WHERE name = ?', [username]);

    if (Array.isArray(existingEmail) && existingEmail.length > 0)
      return res.status(400).json({ error: 'Correo ya registrado' });

    if (Array.isArray(existingName) && existingName.length > 0)
      return res.status(400).json({ error: 'Nombre de usuario ya registrado.' });

    // Generar Recovery Key única
    const recoveryKey = generateRecoveryKey();

    /* ⏸️ BCRYPT DESACTIVADO TEMPORALMENTE
    const hashedPassword = await bcrypt.hash(password, 10);
    */

    // 🔓 Guardar contraseña en texto plano (sin encriptar)
    const [result] = await db.query(
      `INSERT INTO accounts (name, password, email, premdays, lastday, \`key\`, recovery_key, blocked, warnings, group_id)
       VALUES (?, ?, ?, 0, 0, '0', ?, 0, 0, 1)`,
      [username, password, email, recoveryKey]
    );

    const userId = (result as any).insertId;

    /* ⏸️ JWT DESACTIVADO TEMPORALMENTE
    const { accessToken, refreshToken } = generateTokens(userId, email, username);

    await db.query(
      'INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [userId, refreshToken]
    );

    res.cookie('accessToken', accessToken, cookieConfig(120 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieConfig(7 * 24 * 60 * 60 * 1000));
    */

    // 🍪 Guardar sesión simple con cookie de usuario (sin JWT)
    res.cookie('userId', userId, cookieConfig(7 * 24 * 60 * 60 * 1000));
    res.cookie('userEmail', email, cookieConfig(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito.',
      user: { id: userId, email, accountName: username, groupId: 1 },
      recoveryKey // ⚠️ Solo se muestra UNA vez al registrarse
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔑 Login */
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body; // email puede ser email o name
    if (!email || !password)
      return res.status(400).json({ error: 'Email/Usuario y contraseña son requeridos.' });

    // Buscar por email o por name
    const [users] = await db.query(
      'SELECT * FROM accounts WHERE email = ? OR name = ?',
      [email, email]
    );
    if (!Array.isArray(users) || users.length === 0)
      return res.status(401).json({ error: 'Credenciales inválidas.' });

    const user = users[0] as any;

    if (user.blocked === 1)
      return res.status(403).json({ error: 'Cuenta bloqueada.' });

    /* ⏸️ BCRYPT DESACTIVADO TEMPORALMENTE
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    */

    // 🔓 Comparar contraseña en texto plano (sin encriptar)
    if (password !== user.password)
      return res.status(401).json({ error: 'Credenciales inválidas.' });

    /* ⏸️ JWT DESACTIVADO TEMPORALMENTE
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.name);

    await db.query('DELETE FROM refresh_tokens WHERE account_id = ?', [user.id]);
    await db.query(
      'INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [user.id, refreshToken]
    );

    res.cookie('accessToken', accessToken, cookieConfig(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieConfig(7 * 24 * 60 * 60 * 1000));
    */

    // 🍪 Guardar sesión simple con cookie de usuario (sin JWT)
    res.cookie('userId', user.id, cookieConfig(7 * 24 * 60 * 60 * 1000));
    res.cookie('userEmail', user.email, cookieConfig(7 * 24 * 60 * 60 * 1000));

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        accountName: user.name,
        premdays: user.premdays,
        groupId: user.group_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🚪 Logout */
export const logout = async (_req: Request, res: Response) => {
  try {
    // 🍪 Limpiar cookies con las mismas opciones que se usaron al crearlas
    const clearCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: sameSiteMode,
      path: '/'
    };

    res.clearCookie('userId', clearCookieOptions);
    res.clearCookie('userEmail', clearCookieOptions);

    res.json({ success: true, message: 'Sesión cerrada con éxito.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/** 🔄 Refrescar token de acceso *
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ error: 'Refresh token requerido.' });

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
    ) as any;

    const [tokens] = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND account_id = ? AND expires_at > NOW()',
      [refreshToken, decoded.userId]
    ) as any[];

    if (!tokens || tokens.length === 0)
      return res.status(403).json({ error: 'Token inválido o expirado.' });

    const [users] = await db.query('SELECT * FROM accounts WHERE id = ?', [decoded.userId]) as any[];
    if (!users || users.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = users[0];
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, accountName: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '120m' }
    );

    res.cookie('accessToken', newAccessToken, cookieConfig(15 * 60 * 1000));

    res.json({ success: true, message: 'Token refrescado correctamente.' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};
*/

/** 🔄 Refrescar token de acceso (versión sin JWT) */
export const refreshAccessToken = async (_req: Request, res: Response) => {
  // Sin JWT, no hay necesidad de refrescar tokens
  res.json({ success: true, message: 'No se requiere refrescar tokens.' });
};

/* ⏸️ JWT DESACTIVADO TEMPORALMENTE
/** 👤 Verificar usuario autenticado (versión con JWT) *
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user)
      return res.status(401).json({ error: 'No autenticado.' });

    const [users] = await db.query(
      'SELECT id, email, name, premdays, group_id FROM accounts WHERE id = ?',
      [user.userId]
    ) as any[];

    if (!users || users.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const userData = users[0];
    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        accountName: userData.name,
        premdays: userData.premdays,
        groupId: userData.group_id
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
*/

/** 👤 Verificar usuario autenticado (versión sin JWT) */
export const verifyUser = async (req: Request, res: Response) => {
  try {
    // Obtener el userId de las cookies simples
    const userId = req.cookies?.userId;

    if (!userId)
      return res.status(401).json({ error: 'Usuario no existente.' });

    const [users] = await db.query(
      'SELECT id, email, name, premdays, group_id FROM accounts WHERE id = ?',
      [userId]
    ) as any[];

    if (!users || users.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' });

    const userData = users[0];
    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        accountName: userData.name,
        premdays: userData.premdays,
        groupId: userData.group_id
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔑 Solicitar recuperación de contraseña */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ error: 'Email es requerido.' });

    // Buscar usuario por email
    const [users] = await db.query(
      'SELECT id, email, name FROM accounts WHERE email = ?',
      [email]
    ) as any[];

    // Siempre retornar éxito para no revelar si el email existe
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación.'
      });
    }

    const user = users[0];

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Eliminar tokens anteriores del usuario
    await db.query(
      'DELETE FROM password_reset_tokens WHERE account_id = ?',
      [user.id]
    );

    // Guardar token en la base de datos
    await db.query(
      'INSERT INTO password_reset_tokens (account_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // Enviar email
    const emailSent = await sendPasswordResetEmail({
      to: user.email,
      resetToken,
      username: user.name
    });

    if (!emailSent) {
      console.error('Failed to send password reset email');
    }

    res.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de recuperación.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔐 Restablecer contraseña con token */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos.' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    // Buscar token válido
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    ) as any[];

    if (!tokens || tokens.length === 0)
      return res.status(400).json({ error: 'Token inválido o expirado.' });

    const resetToken = tokens[0];

    // Actualizar contraseña
    await db.query(
      'UPDATE accounts SET password = ? WHERE id = ?',
      [newPassword, resetToken.account_id]
    );

    // Eliminar token usado
    await db.query(
      'DELETE FROM password_reset_tokens WHERE account_id = ?',
      [resetToken.account_id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** ✅ Verificar si un token de reset es válido */
export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token)
      return res.status(400).json({ valid: false, error: 'Token es requerido.' });

    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    ) as any[];

    if (!tokens || tokens.length === 0)
      return res.json({ valid: false });

    res.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ valid: false, error: 'Error interno del servidor' });
  }
};

// ========================================
// RECOVERY KEY SYSTEM
// ========================================

/** Oculta parcialmente un email: example@gmail.com -> e***e@gmail.com */
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/** 🔍 Buscar cuenta por email o nombre */
export const findAccount = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;

    if (!identifier)
      return res.status(400).json({ error: 'Email o nombre de cuenta es requerido.' });

    const [accounts] = await db.query(
      'SELECT id, name, email FROM accounts WHERE email = ? OR name = ?',
      [identifier, identifier]
    ) as any[];

    if (!accounts || accounts.length === 0)
      return res.status(404).json({ error: 'Cuenta no encontrada.' });

    const account = accounts[0];

    res.json({
      success: true,
      accountId: account.id,
      accountName: account.name,
      maskedEmail: maskEmail(account.email)
    });
  } catch (error) {
    console.error('Find account error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔐 Verificar Recovery Key */
export const verifyRecoveryKey = async (req: Request, res: Response) => {
  try {
    const { accountId, recoveryKey } = req.body;

    if (!accountId || !recoveryKey)
      return res.status(400).json({ error: 'Account ID y Recovery Key son requeridos.' });

    // Limpiar recovery key (remover guiones)
    const cleanKey = recoveryKey.replace(/-/g, '').toUpperCase();

    if (cleanKey.length !== 16)
      return res.status(400).json({ error: 'Recovery Key inválida.' });

    const [accounts] = await db.query(
      'SELECT id, recovery_key FROM accounts WHERE id = ?',
      [accountId]
    ) as any[];

    if (!accounts || accounts.length === 0)
      return res.status(404).json({ error: 'Cuenta no encontrada.' });

    const account = accounts[0];

    if (account.recovery_key !== cleanKey)
      return res.status(401).json({ error: 'Recovery Key incorrecta.' });

    // Generar token temporal para las operaciones de recovery
    const recoveryToken = crypto.randomBytes(32).toString('hex');

    // Guardar token temporal (expira en 15 minutos)
    await db.query(
      'DELETE FROM password_reset_tokens WHERE account_id = ?',
      [accountId]
    );
    await db.query(
      'INSERT INTO password_reset_tokens (account_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [accountId, recoveryToken]
    );

    res.json({
      success: true,
      token: recoveryToken
    });
  } catch (error) {
    console.error('Verify recovery key error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔑 Reset password usando recovery key (después de verificación) */
export const recoveryResetPassword = async (req: Request, res: Response) => {
  try {
    const { accountId, token, newPassword } = req.body;

    if (!accountId || !token || !newPassword)
      return res.status(400).json({ error: 'Datos incompletos.' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    // Verificar token temporal
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE account_id = ? AND token = ? AND expires_at > NOW()',
      [accountId, token]
    ) as any[];

    if (!tokens || tokens.length === 0)
      return res.status(401).json({ error: 'Sesión de recuperación expirada. Intenta de nuevo.' });

    // Actualizar contraseña
    await db.query(
      'UPDATE accounts SET password = ? WHERE id = ?',
      [newPassword, accountId]
    );

    // Eliminar token usado
    await db.query(
      'DELETE FROM password_reset_tokens WHERE account_id = ?',
      [accountId]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente.'
    });
  } catch (error) {
    console.error('Recovery reset password error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 📧 Cambiar email usando recovery key (después de verificación) */
export const recoveryChangeEmail = async (req: Request, res: Response) => {
  try {
    const { accountId, token, newEmail } = req.body;

    if (!accountId || !token || !newEmail)
      return res.status(400).json({ error: 'Datos incompletos.' });

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail))
      return res.status(400).json({ error: 'Formato de email inválido.' });

    // Verificar token temporal
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE account_id = ? AND token = ? AND expires_at > NOW()',
      [accountId, token]
    ) as any[];

    if (!tokens || tokens.length === 0)
      return res.status(401).json({ error: 'Sesión de recuperación expirada. Intenta de nuevo.' });

    // Verificar que el email no esté en uso
    const [existingEmail] = await db.query(
      'SELECT id FROM accounts WHERE email = ? AND id != ?',
      [newEmail, accountId]
    ) as any[];

    if (existingEmail && existingEmail.length > 0)
      return res.status(400).json({ error: 'Este email ya está en uso.' });

    // Actualizar email
    await db.query(
      'UPDATE accounts SET email = ? WHERE id = ?',
      [newEmail, accountId]
    );

    // Eliminar token usado
    await db.query(
      'DELETE FROM password_reset_tokens WHERE account_id = ?',
      [accountId]
    );

    res.json({
      success: true,
      message: 'Email actualizado correctamente.'
    });
  } catch (error) {
    console.error('Recovery change email error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};