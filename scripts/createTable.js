import dotenv from 'dotenv';
dotenv.config();
import pool from '../db.js';

(async () => {
  try {
    // 1) Create inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        user_id TEXT PRIMARY KEY,
        cards TEXT[],
        last_claim BIGINT
      );
    `);

    // 2) Create users table (including reminders column)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        wallet INTEGER,
        syncbank INTEGER,
        cardpacks JSONB,
        cards JSONB,
        reminders JSONB DEFAULT '{}'
      );
    `);

    // 3) In case you’re upgrading from an older schema that didn’t have reminders,
    //    make sure the column exists (with a default of empty object).
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '{}';
    `);

    // 4) Create cards table
    await pool.query(`
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

    console.log('✅ Tables created/updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating tables:', err);
    process.exit(1);
  }
})();
