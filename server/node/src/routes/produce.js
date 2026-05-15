import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { notify, notifyAdmins } from '../helpers.js';

const router = Router();

router.get('/produce/index.php', requireAuth, (req, res) => {
  const produce = db
    .prepare(
      `SELECT p.*, u.name AS farmer_name
       FROM produce p
       LEFT JOIN users u ON u.id = p.farmer_id
       ORDER BY p.created_at DESC`
    )
    .all();
  res.json({ success: true, produce });
});

router.post('/produce/create.php', requireAuth, (req, res) => {
  const commodity = String(req.body.commodity ?? '').trim();
  const quantity_kg = Number(req.body.quantity_kg ?? 0);
  const source_location = String(req.body.source_location ?? '').trim();
  const notes = String(req.body.notes ?? '').trim();

  if (!commodity || quantity_kg <= 0) {
    return res.status(400).json({ success: false, message: 'Commodity and quantity are required' });
  }

  const result = db
    .prepare(
      `INSERT INTO produce (farmer_id, commodity, quantity_kg, source_location, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.user.sub, commodity, quantity_kg, source_location || null, notes || null);

  const produce = db
    .prepare(
      `SELECT p.*, u.name AS farmer_name FROM produce p
       LEFT JOIN users u ON u.id = p.farmer_id WHERE p.id = ?`
    )
    .get(result.lastInsertRowid);

  notifyAdmins(
    db,
    'produce',
    'New produce registered',
    `${commodity} (${quantity_kg} kg) awaiting verification`,
    '/produce'
  );

  res.status(201).json({ success: true, produce });
});

router.post('/produce/verify.php', requireAuth, requireRoles('official', 'admin'), (req, res) => {
  const produce_id = Number(req.body.produce_id ?? 0);
  const grade = String(req.body.grade ?? '').trim();
  const notes = String(req.body.notes ?? '').trim();

  if (!produce_id || !['A', 'B', 'C'].includes(grade)) {
    return res
      .status(400)
      .json({ success: false, message: 'Valid produce ID and grade (A, B, C) are required' });
  }

  db.prepare('UPDATE produce SET quality_grade = ?, status = ? WHERE id = ?').run(grade, 'verified', produce_id);
  db.prepare(
    'INSERT INTO quality_checks (produce_id, official_id, grade, notes) VALUES (?, ?, ?, ?)'
  ).run(produce_id, req.user.sub, grade, notes || null);

  const p = db.prepare('SELECT farmer_id, commodity FROM produce WHERE id = ?').get(produce_id);
  if (p) {
    notify(
      db,
      p.farmer_id,
      'quality',
      'Produce verified',
      `Your ${p.commodity} was graded ${grade}`,
      '/produce'
    );
  }

  res.json({ success: true, message: 'Produce verified successfully' });
});

export default router;
