import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
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

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Log environment variables for debugging
// console.log('📍 Environment variables loaded:');
// console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
// console.log('  BACKEND_URL:', process.env.BACKEND_URL);
// console.log('  MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? '✓ Set' : '✗ Not set');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4321',
  'https://otserver-monorepo.onrender.com', 'https://mystovia.online'
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); 
// API routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin/marketplace', adminMarketplaceRoutes);

// Community routes
app.use('/api/forum', forumRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/downloads', downloadsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/support', supportRoutes);

// Admin routes
app.use('/api/admin/users', userManagementRoutes);

// Serve Astro client assets
app.use(express.static(path.resolve(__dirname, "../../dist/client")));

// Load Astro SSR safely
let astroHandler = null;
try {
  const mod = await import("../../dist/server/entry.mjs");
  astroHandler = mod.handler;
} catch (e) {
  console.error("❌ Astro SSR handler NOT found:", e);
}

// Catch-all routes → Astro SSR
app.use((req, res, next) => {
  if (astroHandler) {
    return astroHandler(req, res);
  }
  res.status(500).send("SSR handler not available.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});