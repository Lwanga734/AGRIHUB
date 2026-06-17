import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
function pctChange(t, y) { if (!y) return t ? 100 : null; return Math.round(((t - y) / y) * 100); }

router.get('/dashboard/stats', requireAuth, async (req, res, next) => {
  try {
    const today = todayStr();
    const yesterday = yesterdayStr();

    const [{ data: pToday }, { data: pYday }, { data: prToday }, { data: prYday }, { data: txToday }, { data: txYday },
      { data: recentProduce }, { data: recentPrices }, { data: recentTx }, { data: allPrices }] = await Promise.all([
      db.from('produce').select('quantity_kg').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`),
      db.from('produce').select('id').gte('created_at', `${yesterday}T00:00:00`).lt('created_at', `${yesterday}T23:59:59`),
      db.from('prices').select('price_ugx').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`),
      db.from('prices').select('price_ugx').gte('created_at', `${yesterday}T00:00:00`).lt('created_at', `${yesterday}T23:59:59`),
      db.from('transactions').select('amount_ugx, buyer_id').gte('created_at', `${today}T00:00:00`).lt('created_at', `${today}T23:59:59`),
      db.from('transactions').select('id, buyer_id').gte('created_at', `${yesterday}T00:00:00`).lt('created_at', `${yesterday}T23:59:59`),
      db.from('produce').select('commodity, quantity_kg, created_at, users!produce_farmer_id_fkey(name)').order('created_at', { ascending: false }).limit(15),
      db.from('prices').select('commodity, price_ugx, created_at, users!prices_logged_by_fkey(name)').order('created_at', { ascending: false }).limit(15),
      db.from('transactions').select('quantity_kg, amount_ugx, created_at, produce!transactions_produce_id_fkey(commodity), recorder:users!transactions_recorded_by_fkey(name)').order('created_at', { ascending: false }).limit(15),
      db.from('prices').select('commodity, price_ugx, unit, created_at').order('created_at', { ascending: false }),
    ]);

    const avgFn = (rows) => rows?.length ? rows.reduce((s, r) => s + (r.price_ugx ?? 0), 0) / rows.length : 0;
    const activity = [
      ...(recentProduce ?? []).map(({ users, ...p }) => ({ type: 'produce', detail: `${p.commodity} registered`, quantity_kg: p.quantity_kg, amount: null, created_at: p.created_at, actor: users?.name ?? null })),
      ...(recentPrices ?? []).map(({ users, ...p }) => ({ type: 'price', detail: `${p.commodity} @ UGX ${p.price_ugx}`, quantity_kg: null, amount: p.price_ugx, created_at: p.created_at, actor: users?.name ?? null })),
      ...(recentTx ?? []).map(({ produce: prod, recorder, ...t }) => ({ type: 'transaction', detail: `${prod?.commodity ?? 'Unknown'} transaction`, quantity_kg: t.quantity_kg, amount: t.amount_ugx, created_at: t.created_at, actor: recorder?.name ?? null })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 15);

    const latestPrices = new Map();
    for (const p of allPrices ?? []) { if (!latestPrices.has(p.commodity)) latestPrices.set(p.commodity, p); }

    res.json({
      stats: {
        produce_today: pToday?.length ?? 0,
        produce_volume_today: pToday?.reduce((s, r) => s + (r.quantity_kg ?? 0), 0) ?? 0,
        produce_change: pctChange(pToday?.length ?? 0, pYday?.length ?? 0),
        avg_price_today: Math.round(avgFn(prToday)),
        avg_price_change: pctChange(avgFn(prToday), avgFn(prYday)),
        transactions_today: txToday?.length ?? 0,
        transactions_value: txToday?.reduce((s, r) => s + (r.amount_ugx ?? 0), 0) ?? 0,
        transactions_change: pctChange(txToday?.length ?? 0, txYday?.length ?? 0),
        active_traders: new Set(txToday?.map((r) => r.buyer_id) ?? []).size,
        traders_change: pctChange(new Set(txToday?.map((r) => r.buyer_id) ?? []).size, new Set(txYday?.map((r) => r.buyer_id) ?? []).size),
      },
      activity,
      commodity_prices: [...latestPrices.values()].sort((a, b) => a.commodity.localeCompare(b.commodity)),
    });
  } catch (err) { next(err); }
});

export default router;
