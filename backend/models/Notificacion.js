const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: {
    type: String,
    enum: ['like', 'comentario'],
    required: true
  },
  mensaje: { type: String, required: true },
  ejercicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Ejercicio' },
  leida: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notificacion', notificacionSchema);