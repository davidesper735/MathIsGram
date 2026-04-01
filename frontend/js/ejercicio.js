const API = 'http://localhost:5000/api';
const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
const tokenActual = localStorage.getItem('token');

const params = new URLSearchParams(window.location.search);
const ejercicioId = params.get('id');

if (!ejercicioId) window.location.href = 'index.html';

// Tema
(function() {
  if (localStorage.getItem('tema') === 'claro') document.documentElement.classList.add('claro');
})();

// Navbar
if (usuarioActual) {
  document.getElementById('nav-usuario').textContent = `👤 ${usuarioActual.nombre}`;
}

// ===== CARGAR EJERCICIO =====
let ejercicioActual = null;

async function cargarEjercicio() {
  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}`);
    if (!res.ok) throw new Error();
    const ej = await res.json();
    ejercicioActual = ej;

    document.title = `${ej.titulo} — ForoMat`;

    // Título
    document.getElementById('ej-titulo').textContent = ej.titulo;

    // Badges
    document.getElementById('ej-badges').innerHTML = `
      <span class="badge badge-categoria">${ej.categoria}</span>
      <span class="badge badge-${ej.dificultad}">${ej.dificultad}</span>
    `;

    // Meta
    document.getElementById('ej-meta').innerHTML = `
      <span>👤 Por <b>${ej.autor?.nombre || 'Anónimo'}</b></span>
      <span>🕐 ${new Date(ej.fecha).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })}</span>
    `;

    // Descripción
    document.getElementById('ej-descripcion').textContent = ej.descripcion;

    // Fórmula
    document.getElementById('ej-formula').innerHTML = `\\(${ej.formula}\\)`;

    // Solución
    if (ej.solucion) {
      document.getElementById('ej-solucion-bloque').style.display = 'block';
      document.getElementById('ej-solucion').textContent = ej.solucion;
    }

    // Imágenes
    if (ej.imagenes?.length) {
      const secImg = document.createElement('div');
      secImg.className = 'ejercicio-seccion';
      secImg.innerHTML = `
        <h3>🖼️ Imágenes</h3>
        <div class="imagenes-grid">
          ${ej.imagenes.map(url => `
            <img src="http://localhost:5000${url}" 
                 alt="imagen del ejercicio" 
                 class="ejercicio-imagen"
                 onclick="abrirImagen('http://localhost:5000${url}')"/>
          `).join('')}
        </div>
      `;
      document.querySelector('.ejercicio-principal').insertBefore(
        secImg,
        document.getElementById('ej-acciones')
      );
    }

    // Tags
    if (ej.tags?.length) {
      document.getElementById('ej-tags').innerHTML = ej.tags.map(t =>
        `<span class="tag">#${t}</span>`
      ).join('');
    }

    // Acciones top (editar si es autor)
    const esAutor = usuarioActual && (ej.autor?._id === usuarioActual.id);
    if (esAutor) {
      document.getElementById('ej-acciones-top').innerHTML = `
        <a href="editar-ejercicio.html?id=${ej._id}" class="btn-secundario" style="text-decoration:none;padding:0.5rem 1rem;border-radius:8px;font-size:0.9rem">✏️ Editar</a>
      `;
    }

    // Acciones (like, guardar, compartir)
    const yaLiked = usuarioActual && ej.likes.includes(usuarioActual.id);
    const yaGuardado = usuarioActual && ej.guardados.includes(usuarioActual.id);

    document.getElementById('ej-acciones').innerHTML = `
      <button class="btn-accion-grande ${yaLiked ? 'liked' : ''}" id="btn-like" onclick="darLike()">
        ❤️ <span id="num-likes">${ej.likes.length}</span> Me gusta
      </button>
      <button class="btn-accion-grande ${yaGuardado ? 'guardado' : ''}" id="btn-guardar" onclick="guardar()">
        🔖 <span id="txt-guardar">${yaGuardado ? 'Guardado' : 'Guardar'}</span>
      </button>
      <button class="btn-accion-grande" onclick="compartir()">
        🔗 Compartir
      </button>
    `;

    // Comentarios
    renderizarComentarios(ej.comentarios);

    if (usuarioActual) {
      document.getElementById('ej-comentario-input').style.display = 'flex';
    } else {
      document.getElementById('ej-comentario-login').style.display = 'block';
    }

    // Lateral — autor
    document.getElementById('lateral-autor').innerHTML = `
      <div class="lateral-autor-avatar">${(ej.autor?.nombre || '?').charAt(0).toUpperCase()}</div>
      <span>${ej.autor?.nombre || 'Anónimo'}</span>
    `;

    // Lateral — stats
    document.getElementById('lateral-stats').innerHTML = `
      <div class="lateral-stat"><span>❤️ Likes</span><b>${ej.likes.length}</b></div>
      <div class="lateral-stat"><span>💬 Comentarios</span><b>${ej.comentarios.length}</b></div>
      <div class="lateral-stat"><span>🔖 Guardados</span><b>${ej.guardados.length}</b></div>
    `;

    // Lateral — categoría
    document.getElementById('lateral-categoria').innerHTML = `
      <span class="badge badge-categoria">${ej.categoria}</span>
    `;

    // Mostrar contenido
    document.getElementById('estado-cargando').style.display = 'none';
    document.getElementById('ejercicio-contenido').style.display = 'block';

    MathJax.typesetPromise([document.getElementById('ej-formula')]);

  } catch {
    document.getElementById('estado-cargando').textContent = 'Error al cargar el ejercicio.';
  }
}

function renderizarComentarios(comentarios) {
  const lista = document.getElementById('ej-comentarios');
  document.getElementById('ej-num-comentarios').textContent = `(${comentarios.length})`;

  if (comentarios.length === 0) {
    lista.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">Sé el primero en comentar</p>';
    return;
  }

  lista.innerHTML = comentarios.map(c => `
    <div class="comentario-hilo">
      <div class="comentario">
        <div class="comentario-header">
          <span class="comentario-autor">${c.autor?.nombre || 'Anónimo'}</span>
          <span class="comentario-fecha">${new Date(c.fecha).toLocaleDateString()}</span>
        </div>
        <div class="comentario-texto">${c.contenido}</div>
        ${usuarioActual ? `
          <button class="btn-responder" onclick="toggleRespuesta('${c._id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
            Responder
          </button>
          <div class="respuesta-input" id="respuesta-${c._id}" style="display:none">
            <input type="text" placeholder="Escribe una respuesta..." id="input-respuesta-${c._id}"/>
            <button class="btn-primary" onclick="responderComentario('${ejercicioId}', '${c._id}')">Enviar</button>
          </div>` : ''}
      </div>

      ${c.respuestas?.length ? `
        <div class="respuestas-lista">
          ${c.respuestas.map(r => `
            <div class="comentario respuesta">
              <div class="comentario-header">
                <span class="comentario-autor">${r.autor?.nombre || 'Anónimo'}</span>
                <span class="comentario-fecha">${new Date(r.fecha).toLocaleDateString()}</span>
              </div>
              <div class="comentario-texto">${r.contenido}</div>
            </div>
          `).join('')}
        </div>` : ''}
    </div>
  `).join('');
}

// ===== LIKE =====
async function darLike() {
  if (!usuarioActual) { window.location.href = 'index.html'; return; }
  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}/like`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();
    document.getElementById('num-likes').textContent = data.likes;
    document.getElementById('btn-like').classList.toggle('liked', data.liked);
  } catch { console.error('Error like'); }
}

// ===== GUARDAR =====
async function guardar() {
  if (!usuarioActual) { window.location.href = 'index.html'; return; }
  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}/guardar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();
    document.getElementById('btn-guardar').classList.toggle('guardado', data.guardado);
    document.getElementById('txt-guardar').textContent = data.guardado ? 'Guardado' : 'Guardar';
  } catch { console.error('Error guardar'); }
}

// ===== COMPARTIR =====
function compartir() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert('¡Enlace copiado al portapapeles!');
  });
}

// ===== COMENTAR =====
async function comentar() {
  const input = document.getElementById('nuevo-comentario');
  const contenido = input.value.trim();
  if (!contenido) return;

  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}/comentarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ contenido })
    });
    const comentarios = await res.json();
    renderizarComentarios(comentarios);
    input.value = '';
  } catch { console.error('Error comentar'); }
}

function toggleRespuesta(comentarioId) {
  const div = document.getElementById(`respuesta-${comentarioId}`);
  div.style.display = div.style.display === 'none' ? 'flex' : 'none';
  if (div.style.display === 'flex') {
    document.getElementById(`input-respuesta-${comentarioId}`).focus();
  }
}

async function responderComentario(ejercicioId, comentarioId) {
  const input = document.getElementById(`input-respuesta-${comentarioId}`);
  const contenido = input.value.trim();
  if (!contenido) return;

  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}/comentarios/${comentarioId}/respuestas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ contenido })
    });
    const comentarios = await res.json();
    renderizarComentarios(comentarios);
  } catch {
    console.error('Error al responder');
  }
}

function abrirImagen(url) {
  const overlay = document.createElement('div');
  overlay.className = 'imagen-overlay';
  overlay.innerHTML = `<img src="${url}" alt="imagen"/><button onclick="this.parentElement.remove()">✕</button>`;
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

cargarEjercicio();