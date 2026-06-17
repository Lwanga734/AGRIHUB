import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { notify, notifyAdmins } from '../helpers.js';

const router = Router();

router.get('/produce/index.php', requireAuth, async (req, res, next) => {
  try {
    // Supabase join syntax: embed related table via foreign key
    const { data: produce, error } = await db
      .from('produce')
      .select('*, users!produce_farmer_id_fkey(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten farmer_name to match original API shape
    const result = (produce ?? []).map(({ users, ...p }) => ({
      ...p,
      farmer_name: users?.name ?? null,
    }));

    res.json({ success: true, produce: result });
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

    const { data: newProduce, error } = await db
      .from('produce')
      .insert({
        farmer_id: req.user.sub,
        commodity,
        quantity_kg,
        source_location: source_location || null,
        notes: notes || null,
      })
      .select('*, users!produce_farmer_id_fkey(name)')
      .single();

    if (error) throw error;

    const { users, ...p } = newProduce;
    const produce = { ...p, farmer_name: users?.name ?? null };

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

    const { error: updateError } = await db
      .from('produce')
      .update({ quality_grade: grade, status: 'verified' })
      .eq('id', produce_id);

    if (updateError) throw updateError;

    const { error: checkError } = await db
      .from('quality_checks')
      .insert({
        produce_id,
        official_id: req.user.sub,
        grade,
        notes: notes || null,
      });

    if (checkError) throw checkError;

    // Notify the farmer
    const { data: p } = await db
      .from('produce')
      .select('farmer_id, commodity')
      .eq('id', produce_id)
      .maybeSingle();

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
