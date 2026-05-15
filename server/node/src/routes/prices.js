import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { notifyAdmins } from '../helpers.js';

const router = Router();

router.get('/prices/index.php', requireAuth, async (req, res, next) => {
  try {
    const { rows: prices } = await db.execute(`
      SELECT p.*, u.name AS logged_by_name
      FROM prices p
      LEFT JOIN users u ON u.id = p.logged_by
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, prices });
  } catch (err) {
    next(err);
  }
});

router.post('/prices/create.php', requireAuth, requireRoles('official', 'admin'), async (req, res, next) => {
  try {
    const commodity = String(req.body.commodity ?? '').trim();
    const price_ugx = Number(req.body.price_ugx ?? 0);
    const unit = String(req.body.unit ?? 'kg').trim();

    if (!commodity || price_ugx <= 0) {
      return res.status(400).json({ success: false, message: 'Commodity and price are required' });
    }

    const result = await db.execute({
      sql: 'INSERT INTO prices (commodity, price_ugx, unit, logged_by) VALUES (?, ?, ?, ?)',
      args: [commodity, price_ugx, unit, req.user.sub]
    });

    const { rows: priceRows } = await db.execute({
      sql: `SELECT p.*, u.name AS logged_by_name FROM prices p
            LEFT JOIN users u ON u.id = p.logged_by WHERE p.id = ?`,
      args: [Number(result.lastInsertRowid)]
    });
    const price = priceRows[0];

    const { rows: traders } = await db.execute("SELECT id FROM users WHERE role = 'trader'");
    for (const { id } of traders) {
      await db.execute({
        sql: 'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
        args: [id, 'price', 'Price update', `${commodity}: UGX ${price_ugx}/${unit}`, '/prices']
      });
    }

    res.status(201).json({ success: true, price });
  } catch (err) {
    next(err);
  }
});

router.post('/prices/delete.php', requireAuth, requireRoles('official', 'admin'), async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Price ID is required' });
    }
    await db.execute({
      sql: 'DELETE FROM prices WHERE id = ?',
      args: [id]
    });
    res.json({ success: true, message: 'Price removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
