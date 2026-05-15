import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile/stats.php', requireAuth, (req, res) => {
  const id = req.user.sub;
  const user = db.prepare('SELECT created_at FROM users WHERE id = ?').get(id);

  const produce = db
    .prepare(
      'SELECT COUNT(*) AS c, COALESCE(SUM(quantity_kg), 0) AS vol FROM produce WHERE farmer_id = ?'
    )
    .get(id);
  const purchases = db
    .prepare(
      'SELECT COUNT(*) AS c, COALESCE(SUM(amount_ugx), 0) AS val FROM transactions WHERE buyer_id = ?'
    )
    .get(id);
  const sales = db
    .prepare(
      'SELECT COUNT(*) AS c, COALESCE(SUM(amount_ugx), 0) AS val FROM transactions WHERE seller_id = ?'
    )
    .get(id);
  const prices = db.prepare('SELECT COUNT(*) AS c FROM prices WHERE logged_by = ?').get(id);

  res.json({
    success: true,
    stats: {
      produce_registered: produce.c,
      produce_volume: produce.vol,
      purchases: purchases.c,
      purchase_value: purchases.val,
      sales: sales.c,
      sales_value: sales.val,
      prices_logged: prices.c,
      member_since: user?.created_at ?? null,
    },
  });
});

router.post('/profile/update.php', requireAuth, (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const phone = String(req.body.phone ?? '').trim();

  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }

  db.prepare('UPDATE users SET name = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    name,
    phone || null,
    req.user.sub
  );

  res.json({ success: true, message: 'Profile updated successfully' });
});

router.post('/profile/change_password.php', requireAuth, (req, res) => {
  const current = String(req.body.current_password ?? '');
  const next = String(req.body.new_password ?? '');

  if (!current || !next) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }
  if (next.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const row = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.sub);
  if (!row || !bcrypt.compareSync(current, row.password)) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(next, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    hash,
    req.user.sub
  );

  res.json({ success: true, message: 'Password changed successfully' });
});

export default router;
