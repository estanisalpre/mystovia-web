import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import characterRoutes from './routes/characterRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import adminMarketplaceRoutes from './routes/adminMarketplaceRoutes.js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log environment variables for debugging
console.log('📍 Environment variables loaded:');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('  BACKEND_URL:', process.env.BACKEND_URL);
console.log('  MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? '✓ Set' : '✗ Not set');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4321',
  'http://localhost:3001', // por si sirves el front desde el back
  'http://localhost:4321', 
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); 
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);

const frontendPath = path.resolve(__dirname, '../../dist');
app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});