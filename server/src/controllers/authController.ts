import { Request, Response } from 'express';
// import jwt from 'jsonwebtoken'; // JWT COMENTADO - No se usa por ahora
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

// 🔧 Configuración global
const isProduction = process.env.NODE_ENV === 'production';
const cookieDomain = isProduction ? new URL(process.env.FRONTEND_URL || '').hostname : undefined;
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO accounts (name, password, email, premdays, lastday, \`key\`, blocked, warnings, group_id)
       VALUES (?, ?, ?, 0, 0, '0', 0, 0, 1)`,
      [username, hashedPassword, email]
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
      user: { id: userId, email, accountName: username, groupId: 1 }
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/** 🔑 Login */
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });

    const [users] = await db.query('SELECT * FROM accounts WHERE email = ?', [email]);
    if (!Array.isArray(users) || users.length === 0)
      return res.status(401).json({ error: 'Credenciales inválidas.' });

    const user = users[0] as any;

    if (user.blocked === 1)
      return res.status(403).json({ error: 'Cuenta bloqueada.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
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
    /* ⏸️ JWT DESACTIVADO TEMPORALMENTE
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }

    res.clearCookie('accessToken', { domain: cookieDomain });
    res.clearCookie('refreshToken', { domain: cookieDomain });
    */

    // 🍪 Limpiar cookies simples (sin JWT)
    res.clearCookie('userId', { domain: cookieDomain });
    res.clearCookie('userEmail', { domain: cookieDomain });

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