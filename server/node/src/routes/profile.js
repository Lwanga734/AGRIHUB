import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/profile/stats.php', requireAuth, async (req, res, next) => {
  try {
    const id = req.user.sub;
    
    const { rows: userRows } = await db.execute({
      sql: 'SELECT created_at FROM users WHERE id = ?',
      args: [id]
    });
    const user = userRows[0];

    const { rows: produceRows } = await db.execute({
      sql: 'SELECT COUNT(*) AS c, COALESCE(SUM(quantity_kg), 0) AS vol FROM produce WHERE farmer_id = ?',
      args: [id]
    });
    const produce = produceRows[0];

    const { rows: purchasesRows } = await db.execute({
      sql: 'SELECT COUNT(*) AS c, COALESCE(SUM(amount_ugx), 0) AS val FROM transactions WHERE buyer_id = ?',
      args: [id]
    });
    const purchases = purchasesRows[0];

    const { rows: salesRows } = await db.execute({
      sql: 'SELECT COUNT(*) AS c, COALESCE(SUM(amount_ugx), 0) AS val FROM transactions WHERE seller_id = ?',
      args: [id]
    });
    const sales = salesRows[0];

    const { rows: pricesRows } = await db.execute({
      sql: 'SELECT COUNT(*) AS c FROM prices WHERE logged_by = ?',
      args: [id]
    });
    const prices = pricesRows[0];

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
  } catch (err) {
    next(err);
  }
});

router.post('/profile/update.php', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const phone = String(req.body.phone ?? '').trim();

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    await db.execute({
      sql: 'UPDATE users SET name = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [name, phone || null, req.user.sub]
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/profile/change_password.php', requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body.current_password ?? '');
    const nextPassword = String(req.body.new_password ?? '');

    if (!current || !nextPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (nextPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const { rows: userRows } = await db.execute({
      sql: 'SELECT password FROM users WHERE id = ?',
      args: [req.user.sub]
    });
    const row = userRows[0];

    if (!row || !bcrypt.compareSync(current, row.password)) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = bcrypt.hashSync(nextPassword, 10);
    await db.execute({
      sql: 'UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [hash, req.user.sub]
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
