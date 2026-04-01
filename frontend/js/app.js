const API = 'https://foromat-backend.onrender.com/api';

let usuarioActual = JSON.parse(localStorage.getItem('usuario')) || null;
let tokenActual = localStorage.getItem('token') || null;
let categoriaActual = '';
let ordenActual = 'recientes';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  aplicarTema();
  actualizarNavbar();
  cargarEjercicios();
  cargarWidgetTop();
  cargarStatsHero();
});

// ===== TEMA =====
function aplicarTema() {
  if (localStorage.getItem('tema') === 'claro') {
    document.documentElement.classList.add('claro');
  }
}

function toggleTema() {
  const esClaro = document.documentElement.classList.toggle('claro');
  localStorage.setItem('tema', esClaro ? 'claro' : 'oscuro');
}

// ===== NAVBAR =====
function actualizarNavbar() {
  const btnLogin    = document.getElementById('btn-login');
  const btnRegistro = document.getElementById('btn-registro');
  const btnLogout   = document.getElementById('btn-logout');
  const btnNuevo    = document.getElementById('btn-nuevo');
  const btnPerfil   = document.getElementById('btn-perfil');
  const btnNotif    = document.getElementById('btn-notificaciones');
  const btnRanking  = document.getElementById('btn-ranking');
  const sidePerfil  = document.getElementById('side-perfil');
  const label       = document.getElementById('nav-usuario-label');

  if (usuarioActual) {
    label.textContent = usuarioActual.nombre;
    btnPerfil.textContent = usuarioActual.nombre.charAt(0).toUpperCase();
    btnLogin.style.display    = 'none';
    btnRegistro.style.display = 'none';
    btnLogout.style.display   = 'flex';
    btnNuevo.style.display    = 'flex';
    btnPerfil.style.display   = 'flex';
    btnNotif.style.display    = 'flex';
    btnRanking.style.display  = 'flex';
    if (sidePerfil) sidePerfil.style.display = 'flex';
    cargarNotificaciones();
    setInterval(cargarNotificaciones, 30000);
  } else {
    label.textContent = '';
    btnLogin.style.display    = 'flex';
    btnRegistro.style.display = 'flex';
    btnLogout.style.display   = 'none';
    btnNuevo.style.display    = 'none';
    btnPerfil.style.display   = 'none';
    btnNotif.style.display    = 'none';
    btnRanking.style.display  = 'none';
    if (sidePerfil) sidePerfil.style.display = 'none';
  }
}

// ===== SECCIONES =====
function mostrarSeccion(nombre) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));

  const sec = document.getElementById(`seccion-${nombre}`);
  if (sec) sec.classList.add('activa');

  // Sidebar activo
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('activo'));
  const sideBtn = document.getElementById(`side-${nombre}`);
  if (sideBtn) sideBtn.classList.add('activo');

  if (nombre === 'explorar') cargarEjercicios();
  if (nombre === 'ranking')  cargarRanking();
}

function mostrarPerfil() {
  mostrarSeccion('perfil');
  cargarPerfil();
}

// ===== MODALES =====
function mostrarModal(nombre) {
  document.getElementById(`modal-${nombre}`).classList.add('abierto');
}

function cerrarModal(nombre) {
  document.getElementById(`modal-${nombre}`).classList.remove('abierto');
  if (nombre === 'nuevo-ejercicio') {
    ['ej-titulo','ej-descripcion','ej-solucion','ej-tags'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const mf = document.getElementById('ej-formula');
    if (mf) mf.setValue('');
    const err = document.getElementById('ej-error');
    if (err) err.textContent = '';
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('abierto');
  }
});

// ===== AUTH =====
async function login() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const error    = document.getElementById('login-error');
  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { error.textContent = data.mensaje; return; }
    guardarSesion(data);
    cerrarModal('login');
    actualizarNavbar();
    cargarEjercicios();
  } catch { error.textContent = 'Error de conexión'; }
}

async function registro() {
  const nombre   = document.getElementById('registro-nombre').value;
  const email    = document.getElementById('registro-email').value;
  const password = document.getElementById('registro-password').value;
  const error    = document.getElementById('registro-error');
  try {
    const res  = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();
    if (!res.ok) { error.textContent = data.mensaje; return; }
    guardarSesion(data);
    cerrarModal('registro');
    actualizarNavbar();
    cargarEjercicios();
  } catch { error.textContent = 'Error de conexión'; }
}

function guardarSesion(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  tokenActual   = data.token;
  usuarioActual = data.usuario;
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  tokenActual   = null;
  usuarioActual = null;
  actualizarNavbar();
  cargarEjercicios();
}

// ===== FILTROS =====
function filtrarCategoria(cat) {
  categoriaActual = cat;

  // Sidebar
  document.querySelectorAll('.sidebar-item').forEach(i => {
    if (i.getAttribute('onclick') === `filtrarCategoria('${cat}')`) {
      i.classList.add('activo');
    } else if (i.getAttribute('onclick')?.startsWith('filtrarCategoria')) {
      i.classList.remove('activo');
    }
  });

  // Chips derecha
  document.querySelectorAll('.cat-chip').forEach(c => {
    c.classList.toggle('activo', c.getAttribute('onclick') === `filtrarCategoria('${cat}')`);
  });

  mostrarSeccion('explorar');
  cargarEjercicios();
}

function cambiarOrden(orden, btn) {
  ordenActual = orden;
  document.querySelectorAll('.toolbar-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  cargarEjercicios();
}

// ===== BUSCADOR =====
function buscarEjercicios() {
  const texto = document.getElementById('buscador-input').value.toLowerCase();
  document.querySelectorAll('.post-card').forEach(card => {
    const titulo = card.querySelector('.post-title')?.textContent.toLowerCase() || '';
    card.style.display = titulo.includes(texto) ? 'flex' : 'none';
  });
}

function filtrarPorTag(tag, event) {
  event.stopPropagation();
  cerrarModal('detalle');
  document.getElementById('buscador-input').value = tag;
  mostrarSeccion('explorar');
  buscarEjercicios();
}

// ===== CARGAR EJERCICIOS =====
async function cargarEjercicios() {
  const lista = document.getElementById('lista-ejercicios');
  if (!lista) return;
  lista.innerHTML = '<p class="cargando">Cargando ejercicios...</p>';

  const dificultad = document.getElementById('filtro-dificultad')?.value || '';
  let url = `${API}/ejercicios?`;
  if (categoriaActual) url += `categoria=${categoriaActual}&`;
  if (dificultad)      url += `dificultad=${dificultad}`;

  try {
    const res       = await fetch(url);
    let ejercicios  = await res.json();

    // Ordenar
    if (ordenActual === 'populares')   ejercicios.sort((a,b) => b.likes.length - a.likes.length);
    if (ordenActual === 'comentados')  ejercicios.sort((a,b) => b.comentarios.length - a.comentarios.length);
    if (ordenActual === 'recientes')   ejercicios.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    if (ejercicios.length === 0) {
      lista.innerHTML = '<p class="cargando">No hay ejercicios aún. ¡Sé el primero en publicar!</p>';
      return;
    }

    lista.innerHTML = ejercicios.map(ej => postCardHTML(ej)).join('');
    MathJax.typesetPromise([lista]);
  } catch {
    lista.innerHTML = '<p class="cargando">Error al cargar ejercicios.</p>';
  }
}

// ===== TARJETA ESTILO REDDIT =====
function postCardHTML(ej) {
  const yaLiked   = usuarioActual && ej.likes.includes(usuarioActual.id);
  const yaGuardado = usuarioActual && ej.guardados.includes(usuarioActual.id);
  const fecha     = new Date(ej.fecha).toLocaleDateString('es-CO', { day:'numeric', month:'short' });
  const difIcon   = ej.dificultad === 'facil' ? '🟢' : ej.dificultad === 'medio' ? '🟡' : '🔴';

  return `
    <div class="post-card" onclick="window.location.href='ejercicio.html?id=${ej._id}'">

      <!-- Votos -->
      <div class="post-votes" onclick="event.stopPropagation()">
        <button class="vote-btn up ${yaLiked ? 'activo' : ''}" onclick="darLike('${ej._id}', this)" title="Me gusta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${yaLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </button>
        <span class="vote-count" id="likes-${ej._id}">${ej.likes.length}</span>
        <button class="vote-btn down" title="No me gusta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </button>
      </div>

      <!-- Cuerpo -->
      <div class="post-body">
        <div class="post-meta">
          <span class="post-category">${ej.categoria}</span>
          <span class="post-author">u/${ej.autor?.nombre || 'anónimo'}</span>
          <span class="post-date">${fecha}</span>
          <span class="badge-${ej.dificultad}">${difIcon} ${ej.dificultad}</span>
        </div>

        <div class="post-title">${ej.titulo}</div>

        <div class="post-formula" onclick="event.stopPropagation()">\\(${ej.formula}\\)</div>

        ${ej.tags?.length ? `
          <div class="post-tags" onclick="event.stopPropagation()">
            ${ej.tags.map(t => `<span class="tag" onclick="filtrarPorTag('${t}', event)">#${t}</span>`).join('')}
          </div>` : ''}

        <div class="post-actions" onclick="event.stopPropagation()">
          <button class="post-action-btn" onclick="window.location.href='ejercicio.html?id=${ej._id}'">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${ej.comentarios.length} comentarios
          </button>
          <button class="post-action-btn ${yaGuardado ? 'guardado' : ''}" onclick="guardarEjercicio('${ej._id}', this)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="${yaGuardado ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            ${yaGuardado ? 'Guardado' : 'Guardar'}
          </button>
          <button class="post-action-btn" onclick="compartir('${ej._id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Compartir
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===== LIKE =====
async function darLike(id, btn) {
  if (!usuarioActual) { mostrarModal('login'); return; }
  try {
    const res  = await fetch(`${API}/ejercicios/${id}/like`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();
    const count = document.getElementById(`likes-${id}`);
    if (count) count.textContent = data.likes;
    btn.classList.toggle('activo', data.liked);
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${data.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
  } catch { console.error('Error like'); }
}

// ===== GUARDAR =====
async function guardarEjercicio(id, btn) {
  if (!usuarioActual) { mostrarModal('login'); return; }
  try {
    const res  = await fetch(`${API}/ejercicios/${id}/guardar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();
    btn.classList.toggle('guardado', data.guardado);
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="${data.guardado ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
      ${data.guardado ? 'Guardado' : 'Guardar'}
    `;
  } catch { console.error('Error guardar'); }
}

// ===== COMPARTIR =====
function compartir(id) {
  const url = `${window.location.origin}/frontend/ejercicio.html?id=${id}`;
  navigator.clipboard.writeText(url).then(() => alert('¡Enlace copiado!'));
}

// ===== WIDGET TOP =====
async function cargarWidgetTop() {
  const widget = document.getElementById('widget-top');
  if (!widget) return;
  try {
    const res  = await fetch(`${API}/ejercicios`);
    const data = await res.json();
    const top  = [...data].sort((a,b) => b.likes.length - a.likes.length).slice(0, 5);

    if (top.length === 0) { widget.innerHTML = '<p style="color:var(--text3);font-size:0.8rem;padding:0.5rem 1.1rem">Sin ejercicios aún</p>'; return; }

    widget.innerHTML = top.map((ej, i) => {
      const pos = i + 1;
      const posClass = pos <= 3 ? `pos-${pos}-w` : 'pos-n-w';
      const posText  = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`;
      return `
        <div class="widget-ranking-item" onclick="window.location.href='ejercicio.html?id=${ej._id}'">
          <div class="widget-ranking-pos ${posClass}">${posText}</div>
          <div class="widget-ranking-info">
            <div class="widget-ranking-title">${ej.titulo}</div>
            <div class="widget-ranking-likes">❤️ ${ej.likes.length} · 💬 ${ej.comentarios.length}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch { console.error('Error widget'); }
}

// ===== STATS HERO =====
async function cargarStatsHero() {
  try {
    const res  = await fetch(`${API}/ejercicios`);
    const data = await res.json();
    const totalComentarios = data.reduce((acc, ej) => acc + ej.comentarios.length, 0);
    const statEj = document.getElementById('stat-ejercicios');
    const statCo = document.getElementById('stat-comentarios');
    if (statEj) statEj.textContent = data.length;
    if (statCo) statCo.textContent = totalComentarios;
  } catch { console.error('Error stats'); }
}

// ===== RANKING =====
let rankingModo = 'likes';

async function cargarRanking() {
  const lista = document.getElementById('lista-ranking');
  if (!lista) return;
  lista.innerHTML = '<p class="cargando">Cargando ranking...</p>';
  try {
    const res  = await fetch(`${API}/ejercicios`);
    let data   = await res.json();

    if (rankingModo === 'likes')        data.sort((a,b) => b.likes.length - a.likes.length);
    else if (rankingModo === 'comentarios') data.sort((a,b) => b.comentarios.length - a.comentarios.length);
    else if (rankingModo === 'guardados')   data.sort((a,b) => b.guardados.length - a.guardados.length);
    else if (rankingModo === 'recientes')   data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

    const top = data.slice(0, 10);
    if (top.length === 0) { lista.innerHTML = '<p class="cargando">Sin ejercicios aún</p>'; return; }

    lista.innerHTML = top.map((ej, i) => {
      const pos = i + 1;
      const posClase = pos <= 3 ? `pos-${pos}` : 'pos-otro';
      const posTexto = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`;
      const stat = rankingModo === 'likes' ? `❤️ ${ej.likes.length} likes`
        : rankingModo === 'comentarios' ? `💬 ${ej.comentarios.length} comentarios`
        : rankingModo === 'guardados'   ? `🔖 ${ej.guardados.length} guardados`
        : `🕐 ${new Date(ej.fecha).toLocaleDateString()}`;

      return `
        <div class="ranking-item" onclick="window.location.href='ejercicio.html?id=${ej._id}'">
          <div class="ranking-posicion ${posClase}">${posTexto}</div>
          <div class="ranking-info">
            <div class="ranking-titulo">${ej.titulo}</div>
            <div class="ranking-formula">\\(${ej.formula}\\)</div>
            <div class="ranking-meta">
              <span class="ranking-stat destacado">${stat}</span>
              <span class="ranking-stat">👤 ${ej.autor?.nombre || 'Anónimo'}</span>
              <span class="ranking-stat">📂 ${ej.categoria}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    MathJax.typesetPromise([lista]);
  } catch { lista.innerHTML = '<p class="cargando">Error al cargar ranking</p>'; }
}

function cambiarRanking(modo, btn) {
  rankingModo = modo;
  document.querySelectorAll('.ranking-tabs .tab-btn').forEach(b => b.classList.remove('activo'));
  btn.classList.add('activo');
  cargarRanking();
}

// ===== PERFIL =====
async function cargarPerfil() {
  if (!usuarioActual) { mostrarModal('login'); return; }
  document.getElementById('perfil-nombre').textContent = usuarioActual.nombre;
  document.getElementById('perfil-email').textContent  = usuarioActual.email;
  document.getElementById('perfil-avatar').textContent = usuarioActual.nombre.charAt(0).toUpperCase();

  try {
    const res  = await fetch(`${API}/ejercicios`);
    const todos = await res.json();

    const publicados = todos.filter(e => e.autor?._id === usuarioActual.id || e.autor?.nombre === usuarioActual.nombre);
    const guardados  = todos.filter(e => e.guardados.includes(usuarioActual.id));
    const totalLikes = publicados.reduce((acc, e) => acc + e.likes.length, 0);

    document.getElementById('perfil-stats').innerHTML = `
      <div class="stat-card"><div class="stat-numero">${publicados.length}</div><div class="stat-label">Publicados</div></div>
      <div class="stat-card"><div class="stat-numero">${totalLikes}</div><div class="stat-label">Likes recibidos</div></div>
      <div class="stat-card"><div class="stat-numero">${guardados.length}</div><div class="stat-label">Guardados</div></div>
    `;

    const listaPub = document.getElementById('lista-publicados');
    const listaGua = document.getElementById('lista-guardados');

    listaPub.innerHTML = publicados.length === 0
      ? '<p class="cargando">Aún no has publicado ejercicios</p>'
      : publicados.map(ej => postCardHTML(ej)).join('');

    listaGua.innerHTML = guardados.length === 0
      ? '<p class="cargando">Aún no has guardado ejercicios</p>'
      : guardados.map(ej => postCardHTML(ej)).join('');

    MathJax.typesetPromise([listaPub, listaGua]);
  } catch { console.error('Error perfil'); }
}

function cambiarTab(nombre) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
  document.querySelectorAll('.tab-contenido').forEach(c => c.classList.remove('activo'));
  document.getElementById(`tab-${nombre}`).classList.add('activo');
  event.target.classList.add('activo');
}

// ===== NOTIFICACIONES =====
let panelAbierto = false;

async function cargarNotificaciones() {
  if (!usuarioActual) return;
  try {
    const res   = await fetch(`${API}/notificaciones`, {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const notifs = await res.json();
    const noLeidas = notifs.filter(n => !n.leida).length;
    const badge  = document.getElementById('badge-notif');
    if (badge) {
      badge.style.display = noLeidas > 0 ? 'inline' : 'none';
      badge.textContent   = noLeidas;
    }
    const lista = document.getElementById('lista-notificaciones');
    if (!lista) return;
    lista.innerHTML = notifs.length === 0
      ? '<div class="notif-vacia">Sin notificaciones 🎉</div>'
      : notifs.map(n => `
        <div class="notif-item ${n.leida ? '' : 'no-leida'}" onclick="irAEjercicio('${n._id}','${n.ejercicio?._id}')">
          <div class="notif-icono">${n.tipo === 'like' ? '❤️' : '💬'}</div>
          <div class="notif-texto">
            <div class="notif-mensaje">${n.mensaje}</div>
            <div class="notif-fecha">${new Date(n.fecha).toLocaleDateString('es-CO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>`).join('');
  } catch { console.error('Error notificaciones'); }
}

function toggleNotificaciones() {
  const panel = document.getElementById('panel-notificaciones');
  panelAbierto = !panelAbierto;
  panel.style.display = panelAbierto ? 'block' : 'none';
  if (panelAbierto) cargarNotificaciones();
}

async function marcarTodasLeidas() {
  try {
    await fetch(`${API}/notificaciones/leer`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    cargarNotificaciones();
  } catch { console.error('Error'); }
}

async function irAEjercicio(notifId, ejercicioId) {
  await fetch(`${API}/notificaciones/${notifId}/leer`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${tokenActual}` }
  });
  if (ejercicioId) window.location.href = `ejercicio.html?id=${ejercicioId}`;
  toggleNotificaciones();
}

document.addEventListener('click', (e) => {
  const panel = document.getElementById('panel-notificaciones');
  const btn   = document.getElementById('btn-notificaciones');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.style.display = 'none';
    panelAbierto = false;
  }
});