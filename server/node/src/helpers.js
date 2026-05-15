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

export function notify(db, userId, type, title, message, link = null) {
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, type, title, message, link);
}

export function notifyAdmins(db, type, title, message, link = null) {
  const admins = db.prepare("SELECT id FROM users WHERE role IN ('admin','official')").all();
  for (const { id } of admins) {
    notify(db, id, type, title, message, link);
  }
}
