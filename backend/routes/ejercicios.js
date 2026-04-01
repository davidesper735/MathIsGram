const express = require('express');
const router = express.Router();
const Ejercicio = require('../models/Ejercicio');
const proteger = require('../middleware/authMiddleware');
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');

// OBTENER TODOS (con filtro opcional por categoría)
router.get('/', async (req, res) => {
  try {
    const filtro = {};
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    if (req.query.dificultad) filtro.dificultad = req.query.dificultad;

    const ejercicios = await Ejercicio.find(filtro)
      .populate('autor', 'nombre')
      .sort({ fecha: -1 });

    res.json(ejercicios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ejercicios' });
  }
});

// OBTENER UNO POR ID
router.get('/:id', async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id)
      .populate('autor', 'nombre')
      .populate('comentarios.autor', 'nombre');

    if (!ejercicio) return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
    res.json(ejercicio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ejercicio' });
  }
});

// CREAR EJERCICIO (requiere login)
router.post('/', proteger, async (req, res) => {
  const { titulo, descripcion, formula, solucion, categoria, dificultad } = req.body;
  try {
    const ejercicio = await Ejercicio.create({
      titulo, descripcion, formula, solucion,
      categoria, dificultad,
      autor: req.usuario.id
    });
    res.status(201).json(ejercicio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear ejercicio' });
  }
});

// DAR / QUITAR LIKE
router.put('/:id/like', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id).populate('autor', '_id nombre');
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    const yaLiked = ejercicio.likes.includes(req.usuario.id);
    if (yaLiked) {
      ejercicio.likes = ejercicio.likes.filter(id => id.toString() !== req.usuario.id);
    } else {
      ejercicio.likes.push(req.usuario.id);

      // Notificar al autor si no es el mismo usuario
      if (ejercicio.autor._id.toString() !== req.usuario.id) {
        const yo = await Usuario.findById(req.usuario.id);
        await Notificacion.create({
          usuario: ejercicio.autor._id,
          tipo: 'like',
          mensaje: `A ${yo.nombre} le gustó tu ejercicio "${ejercicio.titulo}"`,
          ejercicio: ejercicio._id
        });
      }
    }

    await ejercicio.save();
    res.json({ likes: ejercicio.likes.length, liked: !yaLiked });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar like' });
  }
});

// GUARDAR / DEJAR DE GUARDAR
router.put('/:id/guardar', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    const yaGuardado = ejercicio.guardados.includes(req.usuario.id);
    if (yaGuardado) {
      ejercicio.guardados = ejercicio.guardados.filter(id => id.toString() !== req.usuario.id);
    } else {
      ejercicio.guardados.push(req.usuario.id);
    }

    await ejercicio.save();
    res.json({ guardado: !yaGuardado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar' });
  }
});

// AGREGAR COMENTARIO
router.post('/:id/comentarios', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id).populate('autor', '_id nombre');
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    ejercicio.comentarios.push({
      autor: req.usuario.id,
      contenido: req.body.contenido
    });

    await ejercicio.save();

    // Notificar al autor si no es el mismo usuario
    if (ejercicio.autor._id.toString() !== req.usuario.id) {
      const yo = await Usuario.findById(req.usuario.id);
      await Notificacion.create({
        usuario: ejercicio.autor._id,
        tipo: 'comentario',
        mensaje: `${yo.nombre} comentó en tu ejercicio "${ejercicio.titulo}"`,
        ejercicio: ejercicio._id
      });
    }

    const actualizado = await Ejercicio.findById(req.params.id)
      .populate('comentarios.autor', 'nombre');

    res.json(actualizado.comentarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al comentar' });
  }
});

// EDITAR EJERCICIO
router.put('/:id', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    if (ejercicio.autor.toString() !== req.usuario.id) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }

    const { titulo, descripcion, formula, solucion, categoria, dificultad, tags } = req.body;
    ejercicio.titulo = titulo || ejercicio.titulo;
    ejercicio.descripcion = descripcion || ejercicio.descripcion;
    ejercicio.formula = formula || ejercicio.formula;
    ejercicio.solucion = solucion ?? ejercicio.solucion;
    ejercicio.categoria = categoria || ejercicio.categoria;
    ejercicio.dificultad = dificultad || ejercicio.dificultad;
    ejercicio.tags = tags ?? ejercicio.tags;

    await ejercicio.save();
    res.json(ejercicio);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar' });
  }
});

// ELIMINAR EJERCICIO
router.delete('/:id', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    if (ejercicio.autor.toString() !== req.usuario.id) {
      return res.status(401).json({ mensaje: 'No autorizado' });
    }

    await ejercicio.deleteOne();
    res.json({ mensaje: 'Ejercicio eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar' });
  }
});

// RESPONDER COMENTARIO
router.post('/:id/comentarios/:comentarioId/respuestas', proteger, async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) return res.status(404).json({ mensaje: 'No encontrado' });

    const comentario = ejercicio.comentarios.id(req.params.comentarioId);
    if (!comentario) return res.status(404).json({ mensaje: 'Comentario no encontrado' });

    comentario.respuestas.push({
      autor: req.usuario.id,
      contenido: req.body.contenido
    });

    await ejercicio.save();

    // Notificar al autor del comentario
    if (comentario.autor.toString() !== req.usuario.id) {
      const yo = await Usuario.findById(req.usuario.id);
      await Notificacion.create({
        usuario: comentario.autor,
        tipo: 'comentario',
        mensaje: `${yo.nombre} respondió tu comentario en "${ejercicio.titulo}"`,
        ejercicio: ejercicio._id
      });
    }

    const actualizado = await Ejercicio.findById(req.params.id)
      .populate('comentarios.autor', 'nombre')
      .populate('comentarios.respuestas.autor', 'nombre');

    res.json(actualizado.comentarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al responder' });
  }
});

module.exports = router;