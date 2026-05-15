import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { notify, notifyAdmins } from '../helpers.js';

const router = Router();

router.get('/produce/index.php', requireAuth, async (req, res, next) => {
  try {
    const { rows: produce } = await db.execute(`
      SELECT p.*, u.name AS farmer_name
      FROM produce p
      LEFT JOIN users u ON u.id = p.farmer_id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, produce });
  } catch (err) {
    next(err);
  }
});

router.post('/produce/create.php', requireAuth, async (req, res, next) => {
  try {
    const commodity = String(req.body.commodity ?? '').trim();
    const quantity_kg = Number(req.body.quantity_kg ?? 0);
    const source_location = String(req.body.source_location ?? '').trim();
    const notes = String(req.body.notes ?? '').trim();

    if (!commodity || quantity_kg <= 0) {
      return res.status(400).json({ success: false, message: 'Commodity and quantity are required' });
    }

    const result = await db.execute({
      sql: 'INSERT INTO produce (farmer_id, commodity, quantity_kg, source_location, notes) VALUES (?, ?, ?, ?, ?)',
      args: [req.user.sub, commodity, quantity_kg, source_location || null, notes || null]
    });

    const { rows: produceRows } = await db.execute({
      sql: `SELECT p.*, u.name AS farmer_name FROM produce p
            LEFT JOIN users u ON u.id = p.farmer_id WHERE p.id = ?`,
      args: [Number(result.lastInsertRowid)]
    });
    const produce = produceRows[0];

    await notifyAdmins(
      db,
      'produce',
      'New produce registered',
      `${commodity} (${quantity_kg} kg) awaiting verification`,
      '/produce'
    );

    res.status(201).json({ success: true, produce });
  } catch (err) {
    next(err);
  }
});

router.post('/produce/verify.php', requireAuth, requireRoles('official', 'admin'), async (req, res, next) => {
  try {
    const produce_id = Number(req.body.produce_id ?? 0);
    const grade = String(req.body.grade ?? '').trim();
    const notes = String(req.body.notes ?? '').trim();

    if (!produce_id || !['A', 'B', 'C'].includes(grade)) {
      return res.status(400).json({ success: false, message: 'Valid produce ID and grade (A, B, C) are required' });
    }

    await db.execute({
      sql: 'UPDATE produce SET quality_grade = ?, status = ? WHERE id = ?',
      args: [grade, 'verified', produce_id]
    });
    
    await db.execute({
      sql: 'INSERT INTO quality_checks (produce_id, official_id, grade, notes) VALUES (?, ?, ?, ?)',
      args: [produce_id, req.user.sub, grade, notes || null]
    });

    const { rows: pRows } = await db.execute({
      sql: 'SELECT farmer_id, commodity FROM produce WHERE id = ?',
      args: [produce_id]
    });
    const p = pRows[0];

    if (p) {
      await notify(
        db,
        p.farmer_id,
        'quality',
        'Produce verified',
        `Your ${p.commodity} was graded ${grade}`,
        '/produce'
      );
    }

    res.json({ success: true, message: 'Produce verified successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
