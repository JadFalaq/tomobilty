CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'MAD',
  status VARCHAR(20) DEFAULT 'created',
  provider VARCHAR(20) DEFAULT 'stripe',
  provider_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
