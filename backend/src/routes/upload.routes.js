const express = require('express');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const bucketName = 'car-images';

// Use memory storage for multer as we'll upload to Supabase
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error('INVALID_FILE_TYPE'));
    }
    cb(null, true);
  }
});

router.post(
  '/car-image',
  verifyToken,
  requireAdmin,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.message === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: 'Type de fichier invalide, image requise'
          });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Fichier trop volumineux (max 5MB)'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Erreur lors de l\'upload du fichier'
        });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      console.log('No file received in upload request - returning null URL');
      return res.status(200).json({
        success: true,
        data: {
          url: null,
          message: 'Aucun fichier à uploader'
        }
      });
    }

    try {
      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase();
      const originalName = path.basename(file.originalname, ext);
      const cleanName = originalName
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .toUpperCase();
      
      const fileName = `${cleanName}-${Date.now()}${ext}`;
      const filePath = `cars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Image uploaded to Supabase. Public URL:', publicUrl);

      res.status(201).json({
        success: true,
        data: {
          url: publicUrl, // Cloud URL
          filename: fileName,
          mimetype: file.mimetype,
          size: file.size
        }
      });
    } catch (err) {
      console.error('Cloud upload failed:', err);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload vers le cloud',
        error: err.message
      });
    }
  }
);


module.exports = router;
