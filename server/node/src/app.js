import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import produceRoutes from './routes/produce.js';
import pricesRoutes from './routes/prices.js';
import transactionsRoutes from './routes/transactions.js';
import dashboardRoutes from './routes/dashboard.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import profileRoutes from './routes/profile.js';

const app = express();

app.use(cors({
  origin(origin, callback) {
    // Allow all vercel.app origins + localhost
    if (!origin || /localhost/.test(origin) || /\.vercel\.app$/i.test(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

app.use(express.json());

// Health check — shows env var status for debugging
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    backend: 'node',
    database: 'supabase',
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'MISSING',
    },
  });
});

// Middleware: guard all non-health routes if Supabase not configured
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({
      success: false,
      message: 'Server not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    });
  }
  next();
});

app.use(authRoutes);
app.use(produceRoutes);
app.use(pricesRoutes);
app.use(transactionsRoutes);
app.use(dashboardRoutes);
app.use(usersRoutes);
app.use(notificationsRoutes);
app.use(profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

// Seed admin (non-blocking)
initDb().catch((err) => console.error('initDb warning:', err.message));

export default app;
