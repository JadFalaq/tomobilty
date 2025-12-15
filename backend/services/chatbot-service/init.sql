CREATE TABLE IF NOT EXISTS chat_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  user_id VARCHAR(100),
  prompt TEXT,
  answer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO faq (question, answer, category) VALUES
('prix', 'Les tarifs varient selon le modèle et la ville. Consultez notre catalogue pour plus de détails.', 'tarifs'),
('tarif', 'Les tarifs varient selon le modèle et la ville. Consultez notre catalogue pour plus de détails.', 'tarifs'),
('cout', 'Les tarifs varient selon le modèle et la ville. Consultez notre catalogue pour plus de détails.', 'tarifs'),
('assurance', 'Une caution et une assurance tous risques sont incluses dans nos contrats de location.', 'conditions'),
('caution', 'Une caution est requise pour chaque location. Le montant dépend de la catégorie du véhicule.', 'conditions'),
('livraison', 'Nous proposons la livraison à l''aéroport ou à votre hôtel. Ce service peut être facturé en supplément.', 'services'),
('aeroport', 'Nous proposons la livraison à l''aéroport ou à votre hôtel. Ce service peut être facturé en supplément.', 'services'),
('paiement', 'Le paiement sécurisé par carte bancaire est disponible directement sur notre site.', 'paiement'),
('contact', 'Vous pouvez nous contacter au +212 5XX-XXXXXX ou par email à contact@tomobilty.ma', 'contact');
