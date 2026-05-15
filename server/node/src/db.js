import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const url = process.env.TURSO_DATABASE_URL || 'file:./data/agrihub.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
  url,
  authToken,
});

export const initDb = async () => {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'farmer' CHECK(role IN ('farmer','trader','official','admin')),
      phone TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS produce (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL,
      commodity TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      source_location TEXT,
      quality_grade TEXT DEFAULT 'ungraded' CHECK(quality_grade IN ('A','B','C','ungraded')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','sold')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commodity TEXT NOT NULL,
      price_ugx REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      logged_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produce_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      amount_ugx REAL NOT NULL,
      quantity_kg REAL NOT NULL,
      recorded_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quality_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produce_id INTEGER NOT NULL,
      official_id INTEGER NOT NULL,
      grade TEXT NOT NULL CHECK(grade IN ('A','B','C')),
      notes TEXT,
      checked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (produce_id) REFERENCES produce(id) ON DELETE CASCADE,
      FOREIGN KEY (official_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const adminResult = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: ['admin@agrihub.ug']
  });

  if (adminResult.rows.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: ['AgriHub Admin', 'admin@agrihub.ug', hash, 'admin']
    });
  }
};

export default db;
