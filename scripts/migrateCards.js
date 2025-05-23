import './loadEnv.js';

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import db from '../db.js'; // Make sure db.js uses `export default`

const filePath = path.join(path.resolve(), 'cards', 'metadata.json');
const cards = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf-8'));

for (const card of cards) {
  await db.query(
    `INSERT INTO cards (code, name, "group", era, idolname, series, rarity, is_archived)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       "group" = EXCLUDED."group",
       era = EXCLUDED.era,
       idolname = EXCLUDED.idolname,
       series = EXCLUDED.series,
       rarity = EXCLUDED.rarity,
       is_archived = EXCLUDED.is_archived`,
    [
      card.code,
      card.name,
      card.group,
      card.era,
      card.idolname,
      card.series,
      card.rarity,
      !!card.isArchived
    ]
  );
}

console.log('✅ Card migration completed!');
process.exit();
