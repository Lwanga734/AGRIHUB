import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/notifications/index.php', requireAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const notifications = db
    .prepare(
      `SELECT id, user_id, type, title, message, is_read, link, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(req.user.sub, limit)
    .map((n) => ({ ...n, is_read: Boolean(n.is_read) }));

  const unread = db
    .prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(req.user.sub);

  res.json({
    success: true,
    notifications,
    unread_count: unread.c,
  });
});

router.post('/notifications/mark_read.php', requireAuth, (req, res) => {
  const id = Number(req.body.id ?? 0);
  if (id === 0) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.sub);
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
      id,
      req.user.sub
    );
  }
  res.json({ success: true });
});

export default router;
