import { initDb } from './src/db.js';

console.log("Connecting to Turso to initialize tables...");

initDb()
  .then(() => {
    console.log("Successfully created tables and seeded admin user!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to inject tables:", err);
    process.exit(1);
  });
