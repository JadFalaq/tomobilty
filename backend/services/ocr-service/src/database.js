const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'ocr-postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ocr_db',
  user: process.env.DB_USER || 'ocr_user',
  password: process.env.DB_PASSWORD || 'ocr_password'
});
module.exports.query = (t, p) => pool.query(t, p);
module.exports.pool = pool;
