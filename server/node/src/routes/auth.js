import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from '../helpers.js';

const router = Router();
const ROLES = ['farmer', 'trader', 'official', 'admin'];

router.post('/auth/register.php', async (req, res, next) => {
  try {
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

    // Check for existing email
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const { data: newUser, error } = await db
      .from('users')
      .insert({ name, email, password: hash, role, phone: phone || null })
      .select('id, name, email, role, phone')
      .single();

    if (error) throw error;

    const user = publicUser(newUser);
    const token = generateToken(user.id, user.email, user.role);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/login.php', async (req, res, next) => {
  try {
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '').trim();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data: row } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!row || !bcrypt.compareSync(password, row.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = publicUser(row);
    const token = generateToken(user.id, user.email, user.role);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

router.get('/auth/me.php', requireAuth, async (req, res, next) => {
  try {
    const { data: row } = await db
      .from('users')
      .select('id, name, email, role, phone')
      .eq('id', req.user.sub)
      .maybeSingle();

    if (!row) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: publicUser(row) });
  } catch (err) {
    next(err);
  }
});

export default router;
