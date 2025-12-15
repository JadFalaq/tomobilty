const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'admin-postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'admin_db',
  user: process.env.DB_USER || 'admin_user',
  password: process.env.DB_PASSWORD || 'admin_password'
});
module.exports.query = (t, p) => pool.query(t, p);
module.exports.pool = pool;
