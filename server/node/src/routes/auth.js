import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../helpers.js';

const router = Router();
const ROLES = ['farmer', 'trader', 'official', 'admin'];

router.post('/auth/register.php', (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '').trim();
  const role = String(req.body.role ?? 'farmer').trim();
  const phone = String(req.body.phone ?? '').trim();

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)')
    .run(name, email, hash, role, phone || null);

  const user = publicUser(
    db.prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?').get(result.lastInsertRowid)
  );
  const token = generateToken(user.id, user.email, user.role);

  res.status(201).json({ success: true, token, user });
});

router.post('/auth/login.php', (req, res) => {
  const email = String(req.body.email ?? '').trim();
  const password = String(req.body.password ?? '').trim();

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const user = publicUser(row);
  const token = generateToken(user.id, user.email, user.role);
  res.json({ success: true, token, user });
});

router.get('/auth/me.php', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT id, name, email, role, phone FROM users WHERE id = ?')
    .get(req.user.sub);
  if (!row) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user: publicUser(row) });
});

export default router;
