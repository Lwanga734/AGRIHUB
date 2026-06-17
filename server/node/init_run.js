import 'dotenv/config';
import { initDb } from './src/db.js';

console.log('Connecting to Supabase to seed admin user...');

initDb()
  .then(() => {
    console.log('Admin user seeded (or already exists). Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to seed admin user:', err);
    process.exit(1);
  });
