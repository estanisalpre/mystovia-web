import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

/**
 * Register a new user with secure password hashing
 */
export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const [existingUsers] = await db.query(
      'SELECT * FROM accounts WHERE email = ?',
      [email]
    );

    const [existingUsernames] = await db.query(
      'SELECT * FROM accounts WHERE name = ?',
      [username]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    if (Array.isArray(existingUsernames) && existingUsernames.length > 0) {
      return res.status(400).json({ error: 'Nombre de usuario ya registrado.' });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.query(
      `INSERT INTO accounts (name, password, email, premdays, lastday, \`key\`, blocked, warnings, group_id)
       VALUES (?, ?, ?, 0, 0, '0', 0, 0, 1)`,
      [username, hashedPassword, email]
    );

    const userId = (result as any).insertId;

    // Create access token (short-lived)
    const accessToken = jwt.sign(
      { userId, email, accountName: username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await db.query(
      'INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [userId, refreshToken]
    );

    // Set HttpOnly cookies for tokens
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado con éxito.',
      user: {
        id: userId,
        email,
        accountName: username
      }
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login with secure password verification and token generation
 */
export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.query(
      'SELECT * FROM accounts WHERE email = ?',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0] as any;

    if (user.blocked === 1) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create access token (short-lived)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, accountName: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Delete old refresh tokens for this user
    await db.query(
      'DELETE FROM refresh_tokens WHERE account_id = ?',
      [user.id]
    );

    // Store new refresh token
    await db.query(
      'INSERT INTO refresh_tokens (account_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [user.id, refreshToken]
    );

    // Set HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        accountName: user.name,
        premdays: user.premdays
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout - Clear tokens
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      await db.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret'
    ) as any;

    // Check if token exists in database and is not expired
    const [tokens] = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND account_id = ? AND expires_at > NOW()',
      [refreshToken, decoded.userId]
    ) as any[];

    if (!tokens || tokens.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user data
    const [users] = await db.query(
      'SELECT * FROM accounts WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Create new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, accountName: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

/**
 * Verify current user - returns user info from token
 */
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get fresh user data from database
    const [users] = await db.query(
      'SELECT id, email, name, premdays FROM accounts WHERE id = ?',
      [user.userId]
    ) as any[];

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = users[0];

    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        accountName: userData.name,
        premdays: userData.premdays
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
