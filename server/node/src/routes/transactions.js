import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../helpers.js';

const router = Router();

router.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const { data: transactions, error } = await db
      .from('transactions')
      .select(`*, produce!transactions_produce_id_fkey(commodity), buyer:users!transactions_buyer_id_fkey(name), seller:users!transactions_seller_id_fkey(name), recorder:users!transactions_recorded_by_fkey(name)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const result = (transactions ?? []).map(({ produce, buyer, seller, recorder, ...t }) => ({
      ...t, commodity: produce?.commodity ?? null, buyer_name: buyer?.name ?? null,
      seller_name: seller?.name ?? null, recorded_by_name: recorder?.name ?? null,
    }));
    res.json({ success: true, transactions: result });
  } catch (err) { next(err); }
});

router.post('/transactions/create', requireAuth, async (req, res, next) => {
  try {
    const produce_id = Number(req.body.produce_id ?? 0);
    const buyer_id = Number(req.body.buyer_id ?? req.user.sub);
    const amount_ugx = Number(req.body.amount_ugx ?? 0);
    const quantity_kg = Number(req.body.quantity_kg ?? 0);

    if (!produce_id || amount_ugx <= 0 || quantity_kg <= 0)
      return res.status(400).json({ success: false, message: 'Produce, amount and quantity are required' });

    const { data: produce } = await db.from('produce').select('*').eq('id', produce_id).eq('status', 'verified').maybeSingle();
    if (!produce) return res.status(404).json({ success: false, message: 'Produce not found or not yet verified' });

    const { data: newTx, error } = await db
      .from('transactions')
      .insert({ produce_id, buyer_id, seller_id: produce.farmer_id, amount_ugx, quantity_kg, recorded_by: req.user.sub })
      .select(`*, produce!transactions_produce_id_fkey(commodity), buyer:users!transactions_buyer_id_fkey(name), seller:users!transactions_seller_id_fkey(name), recorder:users!transactions_recorded_by_fkey(name)`)
      .single();
    if (error) throw error;

    await db.from('produce').update({ status: 'sold' }).eq('id', produce_id);
    await notify(db, produce.farmer_id, 'transaction', 'Sale recorded', `${produce.commodity} sold for UGX ${amount_ugx}`, '/transactions');

    const { produce: prod, buyer, seller, recorder, ...t } = newTx;
    res.status(201).json({ success: true, transaction: { ...t, commodity: prod?.commodity ?? null, buyer_name: buyer?.name ?? null, seller_name: seller?.name ?? null, recorded_by_name: recorder?.name ?? null } });
  } catch (err) { next(err); }
});

export default router;
