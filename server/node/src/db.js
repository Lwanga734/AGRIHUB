import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client — will be null if env vars missing (handled per-request)
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

export const initDb = async () => {
  if (!supabase) return; // Skip seed if not configured
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
