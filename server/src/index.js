import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import env from './config/env.js';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import tasksRoutes from './routes/tasks.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import journalRoutes from './routes/journal.routes.js';
import fashionRoutes from './routes/fashion.routes.js';
import brandsRoutes from './routes/brands.routes.js';
import wardrobeRoutes from './routes/wardrobe.routes.js';
import outfitsRoutes from './routes/outfits.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import recommendationsRoutes from './routes/recommendations.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Ensure uploads directory exists ──
const uploadsDir = path.resolve(__dirname, '..', env.UPLOAD_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Security Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.options('*', cors());

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many authentication attempts.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ── Static Files (uploads) ──
app.use('/uploads', express.static(uploadsDir));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ELEVATE API is running', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/fashion', fashionRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/outfits', outfitsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// ── Error Handling ──
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

// ── Start Server ──
async function startServer() {
  const port = process.env.PORT || env.PORT || 5000;
  
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 ELEVATE API server running on port ${port} (0.0.0.0)`);
    logger.info(`🚀 ELEVATE API server running on port ${port}`);
    logger.info(`📡 Environment: ${env.NODE_ENV}`);
  });

  try {
    await connectDatabase();
  } catch (error) {
    logger.error('Database connection notice:', error.message);
  }

  return server;
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  logger.error('Failed to start server:', error);
});

export default app;
