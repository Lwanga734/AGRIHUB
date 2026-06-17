import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();
const ROLES = ['farmer', 'trader', 'official', 'admin'];

router.get('/users', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { data: users, error } = await db.from('users').select('id, name, email, role, phone, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    const [{ data: produceCounts }, { data: txData }] = await Promise.all([
      db.from('produce').select('farmer_id'),
      db.from('transactions').select('buyer_id, seller_id'),
    ]);
    const pc = new Map(); for (const r of produceCounts ?? []) pc.set(r.farmer_id, (pc.get(r.farmer_id) ?? 0) + 1);
    const tc = new Map(); for (const r of txData ?? []) { tc.set(r.buyer_id, (tc.get(r.buyer_id) ?? 0) + 1); tc.set(r.seller_id, (tc.get(r.seller_id) ?? 0) + 1); }
    res.json({ success: true, users: (users ?? []).map((u) => ({ ...u, produce_count: pc.get(u.id) ?? 0, tx_count: tc.get(u.id) ?? 0 })) });
  } catch (err) { next(err); }
});

router.post('/users/create', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '').trim();
    const role = String(req.body.role ?? 'farmer').trim();
    const phone = String(req.body.phone ?? '').trim();
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
    const { data: existing } = await db.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
    const { data: newUser, error } = await db.from('users').insert({ name, email, password: bcrypt.hashSync(password, 10), role, phone: phone || null }).select('id, name, email, role, phone, created_at').single();
    if (error) throw error;
    res.status(201).json({ success: true, user: { ...newUser, produce_count: 0, tx_count: 0 } });
  } catch (err) { next(err); }
});

router.post('/users/update-role', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    const role = String(req.body.role ?? '').trim();
    if (!id || !ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Valid user ID and role required' });
    const { error } = await db.from('users').update({ role }).eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Role updated' });
  } catch (err) { next(err); }
});

router.post('/users/delete', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    if (!id) return res.status(400).json({ success: false, message: 'User ID is required' });
    if (id === req.user.sub) return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    const { error } = await db.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

export default router;
