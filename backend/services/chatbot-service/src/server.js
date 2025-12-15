require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, query } = require('./database');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK' });
  } catch (e) {
    res.status(500).json({ status: 'ERROR', error: e.message });
  }
});

// Charger la FAQ depuis la DB au démarrage
let cachedFAQ = [];
const loadFAQ = async () => {
  try {
    const res = await query('SELECT * FROM faq');
    cachedFAQ = res.rows;
    console.log(`${cachedFAQ.length} FAQ items loaded`);
  } catch (e) {
    console.error('Error loading FAQ:', e);
  }
};
// Recharger la FAQ toutes les heures
setInterval(loadFAQ, 3600000);

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, sessionId, userId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt required' });
    }

    // Logique de réponse simple basée sur mots-clés
    let answer = 'Je suis votre assistant Tomobilty. Je peux vous aider avec les tarifs, les conditions de location, ou la réservation. Comment puis-je vous aider ?';
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Chercher dans la FAQ chargée
    const found = cachedFAQ.find(item => lowerPrompt.includes(item.question.toLowerCase()));
    
    if (found) {
      answer = found.answer;
    } else if (lowerPrompt.includes('bonjour') || lowerPrompt.includes('salut')) {
      answer = 'Bonjour ! Bienvenue chez Tomobilty. Comment puis-je vous aider aujourd\'hui ?';
    } else if (lowerPrompt.includes('merci')) {
      answer = 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions.';
    }

    // Sauvegarder la conversation
    const r = await query(
      'INSERT INTO chat_sessions (prompt, answer, session_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [prompt, answer, sessionId || 'anonymous', userId || null]
    );

    res.json({ 
      id: r.rows[0].id, 
      answer,
      timestamp: r.rows[0].created_at
    });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ message: 'Erreur chatbot', error: e.message });
  }
});

app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const r = await query('SELECT * FROM chat_sessions WHERE session_id = $1 ORDER BY created_at ASC LIMIT 50', [sessionId]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: 'Erreur historique', error: e.message });
  }
});

const PORT = process.env.PORT || 8005;

// Attendre que la DB soit prête avant de charger la FAQ
setTimeout(() => {
  loadFAQ();
}, 5000);

app.listen(PORT, () => console.log(`chatbot-service on ${PORT}`));
