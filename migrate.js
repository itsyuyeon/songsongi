import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import pool from '../db/index.js'; // Make sure your db is an ES module
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  try {
    const filePath = path.join(__dirname, '../cards/metadata.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const cards = JSON.parse(rawData);

    for (const card of cards) {
      await pool.query(
        `INSERT INTO cards (code, name, group_name, era, idolname, rarity, series, archived)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO NOTHING`,
        [
          card.code,
          card.name,
          card.group || null,
          card.era || null,
          card.idolname || null,
          card.rarity,
          card.series || null,
          card.archived ?? false
        ]
      );
    }

    console.log('✅ Cards migration complete!');
    process.exit();
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
})();
