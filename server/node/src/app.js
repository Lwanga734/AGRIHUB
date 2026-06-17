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

const allowedOrigins = [
  'http://localhost:5173',
  'https://agrihub-9dt3.vercel.app',
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  return /^https:\/\/[\w-]+\.vercel\.app$/i.test(origin);
}

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Seed admin user on startup (non-blocking — failures are logged, not fatal)
initDb().catch((err) => console.error('initDb warning:', err.message));

app.get('/health', (_req, res) => {
  res.json({ ok: true, backend: 'node', database: 'supabase' });
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

export default app;
