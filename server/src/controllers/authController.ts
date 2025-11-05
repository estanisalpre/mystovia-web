import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { RegisterRequest, LoginRequest } from '../types/index.js';

export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existingUsers] = await db.query(
      'SELECT * FROM accounts WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const accountName = email.split('@')[0] + Math.floor(Math.random() * 10000);

    // Guardar contraseña en plain text (como Tibia)
    const [result] = await db.query(
      `INSERT INTO accounts (name, password, email, premdays, lastday, \`key\`, blocked, warnings, group_id) 
       VALUES (?, ?, ?, 0, 0, '0', 0, 0, 1)`,
      [accountName, password, email] // SIN bcrypt
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: (result as any).insertId,
      accountName: accountName
    });
  } catch (error) {
    console.error('Register error:', error);
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

    // Comparar contraseña en plain text
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