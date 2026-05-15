import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard/stats.php', requireAuth, (req, res) => {
  const today = "date('now')";
  const yesterday = "date('now', '-1 day')";

  const produceToday = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(quantity_kg), 0) AS vol FROM produce WHERE date(created_at) = ${today}`)
    .get();
  const produceYesterday = db
    .prepare(`SELECT COUNT(*) AS c FROM produce WHERE date(created_at) = ${yesterday}`)
    .get();

  const avgPriceToday = db
    .prepare(`SELECT COALESCE(AVG(price_ugx), 0) AS avg FROM prices WHERE date(created_at) = ${today}`)
    .get();
  const avgPriceYesterday = db
    .prepare(`SELECT COALESCE(AVG(price_ugx), 0) AS avg FROM prices WHERE date(created_at) = ${yesterday}`)
    .get();

  const txToday = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(amount_ugx), 0) AS val FROM transactions WHERE date(created_at) = ${today}`
    )
    .get();
  const txYesterday = db
    .prepare(`SELECT COUNT(*) AS c FROM transactions WHERE date(created_at) = ${yesterday}`)
    .get();

  const tradersToday = db
    .prepare(
      `SELECT COUNT(DISTINCT buyer_id) AS c FROM transactions WHERE date(created_at) = ${today}`
    )
    .get();
  const tradersYesterday = db
    .prepare(
      `SELECT COUNT(DISTINCT buyer_id) AS c FROM transactions WHERE date(created_at) = ${yesterday}`
    )
    .get();

  const pctChange = (todayVal, yesterdayVal) => {
    if (!yesterdayVal) return todayVal ? 100 : null;
    return Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
  };

  const activity = db
    .prepare(
      `SELECT * FROM (
         SELECT 'produce' AS type,
                p.commodity || ' registered' AS detail,
                p.quantity_kg,
                NULL AS amount,
                p.created_at,
                u.name AS actor
         FROM produce p JOIN users u ON u.id = p.farmer_id
         UNION ALL
         SELECT 'price',
                pr.commodity || ' @ UGX ' || pr.price_ugx,
                NULL,
                pr.price_ugx,
                pr.created_at,
                u.name
         FROM prices pr JOIN users u ON u.id = pr.logged_by
         UNION ALL
         SELECT 'transaction',
                p.commodity || ' transaction',
                t.quantity_kg,
                t.amount_ugx,
                t.created_at,
                u.name
         FROM transactions t
         JOIN produce p ON p.id = t.produce_id
         JOIN users u ON u.id = t.recorded_by
       ) AS feed
       ORDER BY feed.created_at DESC
       LIMIT 15`
    )
    .all();

  const commodity_prices = db
    .prepare(
      `SELECT commodity, price_ugx, unit
       FROM prices p1
       WHERE created_at = (
         SELECT MAX(created_at) FROM prices p2 WHERE p2.commodity = p1.commodity
       )
       ORDER BY commodity`
    )
    .all();

  res.json({
    stats: {
      produce_today: produceToday.c,
      produce_volume_today: produceToday.vol,
      produce_change: pctChange(produceToday.c, produceYesterday.c),
      avg_price_today: Math.round(avgPriceToday.avg),
      avg_price_change: pctChange(avgPriceToday.avg, avgPriceYesterday.avg),
      transactions_today: txToday.c,
      transactions_value: txToday.val,
      transactions_change: pctChange(txToday.c, txYesterday.c),
      active_traders: tradersToday.c,
      traders_change: pctChange(tradersToday.c, tradersYesterday.c),
    },
    activity,
    commodity_prices,
  });
});

export default router;
