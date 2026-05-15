export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone ?? '',
  };
}

export async function notify(db, userId, type, title, message, link = null) {
  await db.execute({
    sql: 'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    args: [userId, type, title, message, link]
  });
}

export async function notifyAdmins(db, type, title, message, link = null) {
  const result = await db.execute("SELECT id FROM users WHERE role IN ('admin','official')");
  for (const row of result.rows) {
    await notify(db, row.id, type, title, message, link);
  }
}
