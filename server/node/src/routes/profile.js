import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile/stats', requireAuth, async (req, res, next) => {
  try {
    const id = req.user.sub;
    const [{ data: user }, { data: produceRows }, { data: purchasesRows }, { data: salesRows }, { data: pricesRows }] = await Promise.all([
      db.from('users').select('created_at').eq('id', id).maybeSingle(),
      db.from('produce').select('quantity_kg').eq('farmer_id', id),
      db.from('transactions').select('amount_ugx').eq('buyer_id', id),
      db.from('transactions').select('amount_ugx').eq('seller_id', id),
      db.from('prices').select('id').eq('logged_by', id),
    ]);
    res.json({ success: true, stats: {
      produce_registered: produceRows?.length ?? 0,
      produce_volume: produceRows?.reduce((s, r) => s + (r.quantity_kg ?? 0), 0) ?? 0,
      purchases: purchasesRows?.length ?? 0,
      purchase_value: purchasesRows?.reduce((s, r) => s + (r.amount_ugx ?? 0), 0) ?? 0,
      sales: salesRows?.length ?? 0,
      sales_value: salesRows?.reduce((s, r) => s + (r.amount_ugx ?? 0), 0) ?? 0,
      prices_logged: pricesRows?.length ?? 0,
      member_since: user?.created_at ?? null,
    }});
  } catch (err) { next(err); }
});

router.post('/profile/update', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const phone = String(req.body.phone ?? '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const { error } = await db.from('users').update({ name, phone: phone || null }).eq('id', req.user.sub);
    if (error) throw error;
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
});

router.post('/profile/change-password', requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body.current_password ?? '');
    const next_password = String(req.body.new_password ?? '');
    if (!current || !next_password) return res.status(400).json({ success: false, message: 'Current and new password are required' });
    if (next_password.length < 6) return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    const { data: row } = await db.from('users').select('password').eq('id', req.user.sub).maybeSingle();
    if (!row || !bcrypt.compareSync(current, row.password))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const { error } = await db.from('users').update({ password: bcrypt.hashSync(next_password, 10) }).eq('id', req.user.sub);
    if (error) throw error;
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
});

export default router;
