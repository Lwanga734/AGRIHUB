import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

// Service-role key bypasses RLS for server-side operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

/**
 * Seed the default admin account if it doesn't exist.
 * Tables must be created first — run database/supabase_schema.sql
 * once in the Supabase SQL Editor.
 */
export const initDb = async () => {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'admin@agrihub.ug')
    .maybeSingle();

  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await supabase.from('users').insert({
      name: 'AgriHub Admin',
      email: 'admin@agrihub.ug',
      password: hash,
      role: 'admin',
    });
  }
};

export default supabase;
