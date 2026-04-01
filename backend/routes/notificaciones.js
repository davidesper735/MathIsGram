const express = require('express');
const router = express.Router();
const Notificacion = require('../models/Notificacion');
const proteger = require('../middleware/authMiddleware');

// OBTENER MIS NOTIFICACIONES
router.get('/', proteger, async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ usuario: req.usuario.id })
      .populate('ejercicio', 'titulo')
      .sort({ fecha: -1 })
      .limit(20);
    res.json(notificaciones);
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
});

// MARCAR TODAS COMO LEÍDAS
router.put('/leer', proteger, async (req, res) => {
  try {
    await Notificacion.updateMany({ usuario: req.usuario.id, leida: false }, { leida: true });
    res.json({ mensaje: 'Notificaciones marcadas como leídas' });
  } catch {
    res.status(500).json({ mensaje: 'Error' });
  }
});

// MARCAR UNA COMO LEÍDA
router.put('/:id/leer', proteger, async (req, res) => {
  try {
    await Notificacion.findByIdAndUpdate(req.params.id, { leida: true });
    res.json({ mensaje: 'Leída' });
  } catch {
    res.status(500).json({ mensaje: 'Error' });
  }
});

module.exports = router;