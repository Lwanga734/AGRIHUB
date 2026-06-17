import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper: today's date string in ISO format (YYYY-MM-DD)
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pctChange(todayVal, yesterdayVal) {
  if (!yesterdayVal) return todayVal ? 100 : null;
  return Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
}

router.get('/dashboard/stats.php', requireAuth, async (req, res, next) => {
  try {
    const today = todayStr();
    const yesterday = yesterdayStr();

    // ── Produce counts ──────────────────────────────────────────
    const { data: produceTodayRows } = await db
      .from('produce')
      .select('quantity_kg')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    const { data: produceYesterdayRows } = await db
      .from('produce')
      .select('id')
      .gte('created_at', `${yesterday}T00:00:00`)
      .lt('created_at', `${yesterday}T23:59:59.999`);

    const produceTodayCount = produceTodayRows?.length ?? 0;
    const produceVolumeToday = produceTodayRows?.reduce((s, r) => s + (r.quantity_kg ?? 0), 0) ?? 0;
    const produceYesterdayCount = produceYesterdayRows?.length ?? 0;

    // ── Average prices ──────────────────────────────────────────
    const { data: pricesTodayRows } = await db
      .from('prices')
      .select('price_ugx')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    const { data: pricesYesterdayRows } = await db
      .from('prices')
      .select('price_ugx')
      .gte('created_at', `${yesterday}T00:00:00`)
      .lt('created_at', `${yesterday}T23:59:59.999`);

    const avgToday = pricesTodayRows?.length
      ? pricesTodayRows.reduce((s, r) => s + (r.price_ugx ?? 0), 0) / pricesTodayRows.length
      : 0;
    const avgYesterday = pricesYesterdayRows?.length
      ? pricesYesterdayRows.reduce((s, r) => s + (r.price_ugx ?? 0), 0) / pricesYesterdayRows.length
      : 0;

    // ── Transactions ────────────────────────────────────────────
    const { data: txTodayRows } = await db
      .from('transactions')
      .select('amount_ugx, buyer_id')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59.999`);

    const { data: txYesterdayRows } = await db
      .from('transactions')
      .select('id')
      .gte('created_at', `${yesterday}T00:00:00`)
      .lt('created_at', `${yesterday}T23:59:59.999`);

    const txTodayCount = txTodayRows?.length ?? 0;
    const txValueToday = txTodayRows?.reduce((s, r) => s + (r.amount_ugx ?? 0), 0) ?? 0;
    const txYesterdayCount = txYesterdayRows?.length ?? 0;

    const activeTradersToday = new Set(txTodayRows?.map((r) => r.buyer_id) ?? []).size;
    const activeTradersYesterday = new Set(
      (
        await db
          .from('transactions')
          .select('buyer_id')
          .gte('created_at', `${yesterday}T00:00:00`)
          .lt('created_at', `${yesterday}T23:59:59.999`)
      ).data?.map((r) => r.buyer_id) ?? []
    ).size;

    // ── Activity feed (last 15 events) ──────────────────────────
    const [
      { data: recentProduce },
      { data: recentPrices },
      { data: recentTx },
    ] = await Promise.all([
      db
        .from('produce')
        .select('commodity, quantity_kg, created_at, users!produce_farmer_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(15),
      db
        .from('prices')
        .select('commodity, price_ugx, created_at, users!prices_logged_by_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(15),
      db
        .from('transactions')
        .select(
          'quantity_kg, amount_ugx, created_at, produce!transactions_produce_id_fkey(commodity), recorder:users!transactions_recorded_by_fkey(name)'
        )
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const activityFeed = [
      ...(recentProduce ?? []).map(({ users, ...p }) => ({
        type: 'produce',
        detail: `${p.commodity} registered`,
        quantity_kg: p.quantity_kg,
        amount: null,
        created_at: p.created_at,
        actor: users?.name ?? null,
      })),
      ...(recentPrices ?? []).map(({ users, ...p }) => ({
        type: 'price',
        detail: `${p.commodity} @ UGX ${p.price_ugx}`,
        quantity_kg: null,
        amount: p.price_ugx,
        created_at: p.created_at,
        actor: users?.name ?? null,
      })),
      ...(recentTx ?? []).map(({ produce: prod, recorder, ...t }) => ({
        type: 'transaction',
        detail: `${prod?.commodity ?? 'Unknown'} transaction`,
        quantity_kg: t.quantity_kg,
        amount: t.amount_ugx,
        created_at: t.created_at,
        actor: recorder?.name ?? null,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 15);

    // ── Latest price per commodity ──────────────────────────────
    const { data: allPrices } = await db
      .from('prices')
      .select('commodity, price_ugx, unit, created_at')
      .order('created_at', { ascending: false });

    const latestByComodity = new Map();
    for (const p of allPrices ?? []) {
      if (!latestByComodity.has(p.commodity)) {
        latestByComodity.set(p.commodity, p);
      }
    }
    const commodity_prices = [...latestByComodity.values()].sort((a, b) =>
      a.commodity.localeCompare(b.commodity)
    );

    res.json({
      stats: {
        produce_today: produceTodayCount,
        produce_volume_today: produceVolumeToday,
        produce_change: pctChange(produceTodayCount, produceYesterdayCount),
        avg_price_today: Math.round(avgToday),
        avg_price_change: pctChange(avgToday, avgYesterday),
        transactions_today: txTodayCount,
        transactions_value: txValueToday,
        transactions_change: pctChange(txTodayCount, txYesterdayCount),
        active_traders: activeTradersToday,
        traders_change: pctChange(activeTradersToday, activeTradersYesterday),
      },
      activity: activityFeed,
      commodity_prices,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
