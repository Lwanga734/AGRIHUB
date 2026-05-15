import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { notifyAdmins } from '../helpers.js';

const router = Router();

router.get('/prices/index.php', requireAuth, (req, res) => {
  const prices = db
    .prepare(
      `SELECT p.*, u.name AS logged_by_name
       FROM prices p
       LEFT JOIN users u ON u.id = p.logged_by
       ORDER BY p.created_at DESC`
    )
    .all();
  res.json({ success: true, prices });
});

router.post('/prices/create.php', requireAuth, requireRoles('official', 'admin'), (req, res) => {
  const commodity = String(req.body.commodity ?? '').trim();
  const price_ugx = Number(req.body.price_ugx ?? 0);
  const unit = String(req.body.unit ?? 'kg').trim();

  if (!commodity || price_ugx <= 0) {
    return res.status(400).json({ success: false, message: 'Commodity and price are required' });
  }

  const result = db
    .prepare('INSERT INTO prices (commodity, price_ugx, unit, logged_by) VALUES (?, ?, ?, ?)')
    .run(commodity, price_ugx, unit, req.user.sub);

  const price = db
    .prepare(
      `SELECT p.*, u.name AS logged_by_name FROM prices p
       LEFT JOIN users u ON u.id = p.logged_by WHERE p.id = ?`
    )
    .get(result.lastInsertRowid);

  const traders = db.prepare("SELECT id FROM users WHERE role = 'trader'").all();
  for (const { id } of traders) {
    db.prepare(
      'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
    ).run(id, 'price', 'Price update', `${commodity}: UGX ${price_ugx}/${unit}`, '/prices');
  }

  res.status(201).json({ success: true, price });
});

router.post('/prices/delete.php', requireAuth, requireRoles('official', 'admin'), (req, res) => {
  const id = Number(req.body.id ?? 0);
  if (!id) {
    return res.status(400).json({ success: false, message: 'Price ID is required' });
  }
  db.prepare('DELETE FROM prices WHERE id = ?').run(id);
  res.json({ success: true, message: 'Price removed' });
});

export default router;
