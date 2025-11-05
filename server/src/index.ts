import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import characterRoutes from './routes/characterRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 🧭 Necesario para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// 🧱 FRONTEND STATIC FILES (Astro)
const frontendPath = path.resolve(__dirname, '../../dist');
app.use(express.static(frontendPath));

// 🔁 Cualquier ruta no-API va al index.html de Astro
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});