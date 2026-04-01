const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const proteger = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const tipos = /jpeg|jpg|png|gif|webp/;
    const valido = tipos.test(path.extname(file.originalname).toLowerCase());
    valido ? cb(null, true) : cb(new Error('Solo imágenes'));
  }
});

router.post('/', proteger, upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'No se subió imagen' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;