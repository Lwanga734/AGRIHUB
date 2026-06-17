import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/prices/index.php', requireAuth, async (req, res, next) => {
  try {
    const { data: prices, error } = await db
      .from('prices')
      .select('*, users!prices_logged_by_fkey(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (prices ?? []).map(({ users, ...p }) => ({
      ...p,
      logged_by_name: users?.name ?? null,
    }));

    res.json({ success: true, prices: result });
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

    const { data: newPrice, error } = await db
      .from('prices')
      .insert({ commodity, price_ugx, unit, logged_by: req.user.sub })
      .select('*, users!prices_logged_by_fkey(name)')
      .single();

    if (error) throw error;

    const { users, ...p } = newPrice;
    const price = { ...p, logged_by_name: users?.name ?? null };

    // Notify all traders about the new price
    const { data: traders } = await db
      .from('users')
      .select('id')
      .eq('role', 'trader');

    if (traders && traders.length > 0) {
      const notifications = traders.map(({ id }) => ({
        user_id: id,
        type: 'price',
        title: 'Price update',
        message: `${commodity}: UGX ${price_ugx}/${unit}`,
        link: '/prices',
      }));
      await db.from('notifications').insert(notifications);
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

    const { error } = await db.from('prices').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, message: 'Price removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
