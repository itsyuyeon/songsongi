import '../loadEnv.js';
import db from '../db.js';

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS cards (
        code TEXT PRIMARY KEY,
        name TEXT,
        "group" TEXT,
        era TEXT,
        idolname TEXT,
        series TEXT,
        rarity TEXT,
        is_archived BOOLEAN
      );
    `);

    console.log('✅ "cards" table created successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Failed to create "cards" table:', err);
    process.exit(1);
  }
})();
