const bcrypt = require('bcryptjs');
const { query } = require('../database');

class User {
  static async create({ nom, prenom, email, telephone, motDePasse, role = 'client' }) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(motDePasse, salt);
    const res = await query(
      `INSERT INTO users (nom, prenom, email, telephone, mot_de_passe, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nom, prenom, email, telephone, hashed, role]
    );
    return res.rows[0];
  }

  static async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email=$1', [email]);
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await query('SELECT * FROM users WHERE id=$1', [id]);
    return res.rows[0] || null;
  }

  static async update(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return this.findById(id);
    const sets = keys.map((k, i) => `${k}=$${i + 1}`);
    const values = keys.map(k => fields[k]);
    values.push(id);
    const res = await query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${values.length} RETURNING *`, values);
    return res.rows[0];
  }

  static async comparePassword(raw, hashed) {
    return bcrypt.compare(raw, hashed);
  }
}

module.exports = User;
