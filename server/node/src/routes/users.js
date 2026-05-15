import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
const router = Router();
const ROLES = ['farmer', 'trader', 'official', 'admin'];

router.get('/users/index.php', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const { rows: users } = await db.execute(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
             (SELECT COUNT(*) FROM produce WHERE farmer_id = u.id) AS produce_count,
             (SELECT COUNT(*) FROM transactions WHERE buyer_id = u.id OR seller_id = u.id) AS tx_count
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

router.post('/users/create.php', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '').trim();
    const role = String(req.body.role ?? 'farmer').trim();
    const phone = String(req.body.phone ?? '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const { rows: existingRows } = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });
    if (existingRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      args: [name, email, hash, role, phone || null]
    });

    const { rows: userRows } = await db.execute({
      sql: `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at,
                   0 AS produce_count, 0 AS tx_count
            FROM users u WHERE u.id = ?`,
      args: [Number(result.lastInsertRowid)]
    });
    const user = userRows[0];

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

router.post('/users/update_role.php', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    const role = String(req.body.role ?? '').trim();
    if (!id || !ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid user ID and role required' });
    }
    await db.execute({
      sql: 'UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?',
      args: [role, id]
    });
    res.json({ success: true, message: 'Role updated' });
  } catch (err) {
    next(err);
  }
});

router.post('/users/delete.php', requireAuth, requireRoles('admin'), async (req, res, next) => {
  try {
    const id = Number(req.body.id ?? 0);
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    if (id === req.user.sub) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id]
    });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
