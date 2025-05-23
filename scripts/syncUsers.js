import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import pool from '../db/index.js'; // make sure it's a default export
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// folder path to /inventory
const inventoryFolder = path.join(__dirname, '../inventory');

(async () => {
  try {
    const files = fs.readdirSync(inventoryFolder).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(inventoryFolder, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const user = JSON.parse(raw);

      await pool.query(
        `INSERT INTO users (id, username, wallet, syncbank, cardpacks, cards)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           wallet = EXCLUDED.wallet,
           syncbank = EXCLUDED.syncbank,
           cardpacks = EXCLUDED.cardpacks,
           cards = EXCLUDED.cards`,
        [
          user.id,
          user.profile?.username || 'Unknown',
          user.wallet || 0,
          user.syncbank || 0,
          JSON.stringify(user.cardpacks || []),
          JSON.stringify(user.cards || [])
        ]
      );

      console.log(`✅ Synced user: ${user.id}`);
    }

    console.log('✅ All users synced successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Error syncing users:', err);
    process.exit(1);
  }
})();
