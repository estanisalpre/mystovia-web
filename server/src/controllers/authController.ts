import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Usuario, email y contraseña son requeridos.' });
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


    const [result] = await db.query(
      `INSERT INTO accounts (name, password, email, premdays, lastday, \`key\`, blocked, warnings, group_id) 
       VALUES (?, ?, ?, 0, 0, '0', 0, 0, 1)`,
      [username, password, email] 
    );

    res.status(201).json({ 
      message: 'Usuario registrado con éxito.',
      userId: (result as any).insertId,
      accountName: username
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, accountName: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Login successful',
      token,
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