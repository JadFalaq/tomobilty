const { Pool } = require('pg');

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'payment-postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'payment_db',
    user: process.env.DB_USER || 'payment_user',
    password: process.env.DB_PASSWORD || 'payment_password'
  });
}
module.exports.query = (t, p) => pool.query(t, p);
module.exports.pool = pool;
