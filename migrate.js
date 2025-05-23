const fs = require('fs');
const path = require('path');
const pool = require('../db');

(async () => {
  try {
    const filePath = path.join(__dirname, 'inventory.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const inventory = JSON.parse(rawData);

    for (const userId in inventory) {
      const { cards, lastClaim } = inventory[userId];

      await pool.query(
        'INSERT INTO inventory (user_id, cards, last_claim) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
        [userId, cards, lastClaim]
      );
    }

    console.log('✅ Migration complete!');
    process.exit();
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
})();
