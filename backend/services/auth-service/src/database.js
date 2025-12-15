const { Pool } = require('pg');

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'auth-postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'auth_db',
    user: process.env.DB_USER || 'auth_user',
    password: process.env.DB_PASSWORD || 'auth_password'
  });
}

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
