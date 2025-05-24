import dotenv from 'dotenv';
dotenv.config(); // 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../db.js'; //

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

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reminders JSONB;

    `);

    console.log('✅ Tables created!');
    console.log("✅ DATABASE_URL:", process.env.DATABASE_URL);
    process.exit();
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
})();
