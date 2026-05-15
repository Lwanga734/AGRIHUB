import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../helpers.js';

const router = Router();

router.get('/transactions/index.php', requireAuth, async (req, res, next) => {
  try {
    const { rows: transactions } = await db.execute(`
      SELECT t.*, p.commodity,
              buyer.name AS buyer_name,
              seller.name AS seller_name,
              rec.name AS recorded_by_name
       FROM transactions t
       LEFT JOIN produce p ON p.id = t.produce_id
       LEFT JOIN users buyer ON buyer.id = t.buyer_id
       LEFT JOIN users seller ON seller.id = t.seller_id
       LEFT JOIN users rec ON rec.id = t.recorded_by
       ORDER BY t.created_at DESC
    `);
    res.json({ success: true, transactions });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions/create.php', requireAuth, async (req, res, next) => {
  try {
    const produce_id = Number(req.body.produce_id ?? 0);
    const buyer_id = Number(req.body.buyer_id ?? req.user.sub);
    const amount_ugx = Number(req.body.amount_ugx ?? 0);
    const quantity_kg = Number(req.body.quantity_kg ?? 0);

    if (!produce_id || amount_ugx <= 0 || quantity_kg <= 0) {
      return res.status(400).json({ success: false, message: 'Produce, amount and quantity are required' });
    }

    const { rows: produceRows } = await db.execute({
      sql: 'SELECT * FROM produce WHERE id = ? AND status = ?',
      args: [produce_id, 'verified']
    });
    const produce = produceRows[0];

    if (!produce) {
      return res.status(404).json({ success: false, message: 'Produce not found or not yet verified' });
    }

    const seller_id = produce.farmer_id;
    const recorded_by = req.user.sub;

    const result = await db.execute({
      sql: `INSERT INTO transactions (produce_id, buyer_id, seller_id, amount_ugx, quantity_kg, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [produce_id, buyer_id, seller_id, amount_ugx, quantity_kg, recorded_by]
    });

    await db.execute({
      sql: 'UPDATE produce SET status = ? WHERE id = ?',
      args: ['sold', produce_id]
    });

    const { rows: transactionRows } = await db.execute({
      sql: `SELECT t.*, p.commodity,
                  buyer.name AS buyer_name,
                  seller.name AS seller_name,
                  rec.name AS recorded_by_name
           FROM transactions t
           LEFT JOIN produce p ON p.id = t.produce_id
           LEFT JOIN users buyer ON buyer.id = t.buyer_id
           LEFT JOIN users seller ON seller.id = t.seller_id
           LEFT JOIN users rec ON rec.id = t.recorded_by
           WHERE t.id = ?`,
      args: [Number(result.lastInsertRowid)]
    });
    const transaction = transactionRows[0];

    await notify(
      db,
      seller_id,
      'transaction',
      'Sale recorded',
      `${produce.commodity} sold for UGX ${amount_ugx}`,
      '/transactions'
    );

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
});

export default router;
