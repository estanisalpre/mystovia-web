import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Astro SSR handler
// @ts-ignore
import { handler as astroHandler } from '../../dist/server/entry.mjs';

import authRoutes from './routes/authRoutes.js';
import characterRoutes from './routes/characterRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import adminMarketplaceRoutes from './routes/adminMarketplaceRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import wikiRoutes from './routes/wikiRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import downloadsRoutes from './routes/downloadsRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';

// Load environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('📍 Environment variables loaded:');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('  BACKEND_URL:', process.env.BACKEND_URL);
console.log('  MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? '✓ Set' : '✗ Not set');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4321',
  'https://otserver-monorepo.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// API ROUTES FIRST
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);

app.use('/api/forum', forumRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/support', supportRoutes);

app.use('/api/admin/users', userManagementRoutes);

// SERVE STATIC ASSETS FROM ASTRO
app.use(express.static(path.resolve(__dirname, '../../dist/client')));

// ANY NON-API ROUTE → ASTRO SSR
app.all('*', async (req, res) => {
  return astroHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});