import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/notifications/index.php', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const { rows: notifRows } = await db.execute({
      sql: `SELECT id, user_id, type, title, message, is_read, link, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?`,
      args: [req.user.sub, limit]
    });
    const notifications = notifRows.map((n) => ({ ...n, is_read: Boolean(n.is_read) }));

    const { rows: unreadRows } = await db.execute({
      sql: 'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
      args: [req.user.sub]
    });
    const unread = unreadRows[0];

    res.json({
      success: true,
      notifications,
      unread_count: unread.c,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/mark_read.php', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    if (id === 0) {
      await db.execute({
        sql: 'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        args: [req.user.sub]
      });
    } else {
      await db.execute({
        sql: 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        args: [id, req.user.sub]
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
