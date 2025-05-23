const pool = require('../db'); // assumes db.js is correctly set up for Railway DB

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        user_id TEXT PRIMARY KEY,
        cards TEXT[],
        last_claim BIGINT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        wallet INTEGER,
        syncbank INTEGER,
        cardpacks JSONB,
        cards JSONB
      );

      CREATE TABLE IF NOT EXISTS cards (
        code TEXT PRIMARY KEY,
        name TEXT,
        group_name TEXT,
        era TEXT,
        idolname TEXT,
        series TEXT,
        rarity TEXT,
        is_archived BOOLEAN DEFAULT FALSE
      );

    `);

    console.log('✅ Tables created!');
    process.exit();
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
})();
