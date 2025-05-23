const pool = require('./db'); // assumes db.js is set up with your Railway DB

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        user_id TEXT PRIMARY KEY,
        cards TEXT[],
        last_claim BIGINT
      );
    `);
    console.log('✅ Table created!');
    process.exit();
  } catch (err) {
    console.error('❌ Error creating table:', err);
    process.exit(1);
  }
})();
