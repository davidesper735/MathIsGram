const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const proteger = require('../middleware/authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'foromat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }]
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', proteger, upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'No se subió imagen' });
  res.json({ url: req.file.path });
});

module.exports = router;