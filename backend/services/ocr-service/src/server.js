require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { pool, query } = require('./database');
const Tesseract = require('tesseract.js');
const app = express();
app.use(cors({ origin: '*'}));
const upload = multer({ storage: multer.memoryStorage() });
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'OK' });
  } catch(e){
    const allow = process.env.ALLOW_HEALTH_NO_DB === 'true' || process.env.NODE_ENV !== 'production';
    if (allow) {
      res.json({ status:'OK', db:'unavailable' });
    } else {
      res.status(500).json({ status:'ERROR', error:e.message });
    }
  }
});
app.post('/api/ocr/scan', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier requis' });
    const result = await Tesseract.recognize(req.file.buffer, 'eng+fra', { langPath: process.env.TESS_LANG_PATH || '/app/lang-data' });
    const content = result.data.text || '';
    const r = await query('INSERT INTO scans (filename, content) VALUES ($1,$2) RETURNING *', [req.file.originalname, content]);
    res.status(201).json(r.rows[0]);
  } catch(e){ res.status(500).json({ message:'Erreur OCR', error:e.message }); }
});

const parseFields = (text, type) => {
  const norm = text.replace(/\s+/g, ' ').toUpperCase();
  const out = {};
  if (type === 'cnie') {
    const num = norm.match(/([A-Z]{1,2}\d{5,8})/);
    const nom = norm.match(/NOM:?\s*([A-Z\- ]{3,})/);
    const prenom = norm.match(/PRENOMS?:?\s*([A-Z\- ]{3,})/);
    const naissance = norm.match(/NE\s*LE\s*(\d{2}\/\d{2}\/\d{4})/);
    out.numero_cnie = num?.[1] || null;
    out.nom = nom?.[1]?.trim() || null;
    out.prenom = prenom?.[1]?.trim() || null;
    out.date_naissance = naissance?.[1] || null;
  } else if (type === 'permis') {
    const num = norm.match(/PERMIS\s*N[O0]\s*:?\s*(\w{5,})/);
    const nom = norm.match(/NOM:?\s*([A-Z\- ]{3,})/);
    const prenom = norm.match(/PRENOMS?:?\s*([A-Z\- ]{3,})/);
    const delivr = norm.match(/DELIVRE\s*LE\s*(\d{2}\/\d{2}\/\d{4})/);
    const expire = norm.match(/EXPIRE\s*LE\s*(\d{2}\/\d{2}\/\d{4})/);
    out.numero_permis = num?.[1] || null;
    out.nom = nom?.[1]?.trim() || null;
    out.prenom = prenom?.[1]?.trim() || null;
    out.date_delivrance = delivr?.[1] || null;
    out.date_expiration = expire?.[1] || null;
  }
  return out;
};

app.post('/api/ocr/parse', upload.single('file'), async (req, res) => {
  try {
    const type = (req.query.type || 'cnie').toString();
    if (!req.file) return res.status(400).json({ message: 'Fichier requis' });
    const result = await Tesseract.recognize(req.file.buffer, 'eng+fra', { langPath: process.env.TESS_LANG_PATH || '/app/lang-data' });
    const text = result.data.text || '';
    const fields = parseFields(text, type);
    res.json({ type, fields, rawText: text });
  } catch(e){ res.status(500).json({ message:'Erreur parse', error:e.message }); }
});
const PORT = process.env.PORT || 8004;
app.listen(PORT, () => console.log(`ocr-service on ${PORT}`));
