import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Lazy singleton — created on first call so env vars are definitely loaded
let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

// Proxy — routes use `db.from(...)` just like before
const supabase = new Proxy({}, {
  get(_target, prop) {
    return getClient()[prop];
  },
});

export const initDb = async () => {
  const client = getClient();
  const { data: existing } = await client
    .from('users')
    .select('id')
    .eq('email', 'admin@agrihub.ug')
    .maybeSingle();

  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await client.from('users').insert({
      name: 'AgriHub Admin',
      email: 'admin@agrihub.ug',
      password: hash,
      role: 'admin',
    });
  }
};

export default supabase;
