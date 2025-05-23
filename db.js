import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // this should come from Railway
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
