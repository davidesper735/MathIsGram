const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  contenido: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  respuestas: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    contenido: { type: String, required: true },
    fecha: { type: Date, default: Date.now }
  }]
});

const ejercicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true },
  formula: { type: String, required: true },
  solucion: { type: String, default: '' },
  categoria: {
    type: String,
    required: true,
    enum: [
      'integral',
      'derivada',
      'ecuacion-diferencial',
      'algebra-lineal',
      'calculo-multivariable',
      'serie-sucesion',
      'limite',
      'probabilidad',
      'estadistica',
      'geometria',
      'trigonometria',
      'otro'
    ]
  },
  dificultad: {
    type: String,
    enum: ['facil', 'medio', 'dificil'],
    default: 'medio'
  },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  guardados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
  comentarios: [comentarioSchema],
  tags: [{ type: String, trim: true }],
  imagenes: [{ type: String }],
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ejercicio', ejercicioSchema);