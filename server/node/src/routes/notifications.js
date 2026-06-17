import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const { data: notifRows, error } = await db
      .from('notifications')
      .select('id, user_id, type, title, message, is_read, link, created_at')
      .eq('user_id', req.user.sub)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    const notifications = (notifRows ?? []).map((n) => ({ ...n, is_read: Boolean(n.is_read) }));
    const { count: unread_count } = await db.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', req.user.sub).eq('is_read', false);
    res.json({ success: true, notifications, unread_count: unread_count ?? 0 });
  } catch (err) { next(err); }
});

router.post('/notifications/mark-read', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    let query = db.from('notifications').update({ is_read: true }).eq('user_id', req.user.sub);
    if (id !== 0) query = query.eq('id', id);
    const { error } = await query;
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
