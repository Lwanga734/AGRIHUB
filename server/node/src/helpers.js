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

/**
 * Insert a single notification row.
 * @param {import('@supabase/supabase-js').SupabaseClient} db
 */
export async function notify(db, userId, type, title, message, link = null) {
  await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });
}

/**
 * Notify all admin and official users.
 * @param {import('@supabase/supabase-js').SupabaseClient} db
 */
export async function notifyAdmins(db, type, title, message, link = null) {
  const { data: admins } = await db
    .from('users')
    .select('id')
    .in('role', ['admin', 'official']);

  if (!admins) return;

  const rows = admins.map((u) => ({ user_id: u.id, type, title, message, link }));
  if (rows.length > 0) {
    await db.from('notifications').insert(rows);
  }
}
