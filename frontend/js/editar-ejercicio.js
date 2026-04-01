const API = 'https://foromat-backend.onrender.com/api';
const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
const tokenActual = localStorage.getItem('token');
let imagenesSubidas = [];

if (!usuarioActual) {
  alert('Debes iniciar sesión');
  window.location.href = 'index.html';
}

// Obtener ID del ejercicio desde la URL
const params = new URLSearchParams(window.location.search);
const ejercicioId = params.get('id');

if (!ejercicioId) {
  alert('Ejercicio no encontrado');
  window.location.href = 'index.html';
}

const mathField = document.getElementById('ej-formula');

// ===== CARGAR DATOS DEL EJERCICIO =====
async function cargarEjercicio() {
  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}`);
    const ej = await res.json();

    if (ej.autor?._id !== usuarioActual.id) {
      alert('No puedes editar este ejercicio');
      window.location.href = 'index.html';
      return;
    }

    document.getElementById('ej-titulo').value = ej.titulo;
    document.getElementById('ej-descripcion').value = ej.descripcion;
    document.getElementById('ej-solucion').value = ej.solucion || '';
    document.getElementById('ej-categoria').value = ej.categoria;
    document.getElementById('ej-dificultad').value = ej.dificultad;
    document.getElementById('ej-tags').value = ej.tags?.join(', ') || '';
    mathField.setValue(ej.formula);

    // Preview inicial
    document.getElementById('prev-titulo').textContent = ej.titulo;
    document.getElementById('prev-descripcion').textContent = ej.descripcion;
    document.getElementById('prev-categoria').textContent = ej.categoria;
    document.getElementById('prev-dificultad').textContent = ej.dificultad;
    document.getElementById('prev-dificultad').className = `badge badge-${ej.dificultad}`;
    document.getElementById('prev-formula').innerHTML = `\\(${ej.formula}\\)`;
    document.getElementById('prev-tags').innerHTML = ej.tags?.map(t => `<span class="tag">#${t}</span>`).join('') || '';
    MathJax.typesetPromise([document.getElementById('prev-formula')]);

  } catch {
    alert('Error al cargar el ejercicio');
  }
}

cargarEjercicio();

// ===== PREVIEW EN TIEMPO REAL =====
document.getElementById('ej-titulo').addEventListener('input', (e) => {
  document.getElementById('prev-titulo').textContent = e.target.value || 'Título';
});

document.getElementById('ej-descripcion').addEventListener('input', (e) => {
  document.getElementById('prev-descripcion').textContent = e.target.value || 'Descripción...';
});

document.getElementById('ej-categoria').addEventListener('change', (e) => {
  document.getElementById('prev-categoria').textContent = e.target.value;
});

document.getElementById('ej-dificultad').addEventListener('change', (e) => {
  const el = document.getElementById('prev-dificultad');
  el.textContent = e.target.value;
  el.className = `badge badge-${e.target.value}`;
});

document.getElementById('ej-tags').addEventListener('input', (e) => {
  const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
  document.getElementById('prev-tags').innerHTML = tags.map(t => `<span class="tag">#${t}</span>`).join('');
});

mathField.addEventListener('input', () => {
  const latex = mathField.getValue('latex');
  const prev = document.getElementById('prev-formula');
  prev.innerHTML = latex ? `\\(${latex}\\)` : '<span style="color:var(--text-muted)">Fórmula...</span>';
  MathJax.typesetPromise([prev]);
});

// ===== GUARDAR CAMBIOS =====
async function guardarCambios() {
  const error = document.getElementById('ej-error');
  const tagsRaw = document.getElementById('ej-tags').value;
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t !== '');

  const body = {
    titulo: document.getElementById('ej-titulo').value,
    descripcion: document.getElementById('ej-descripcion').value,
    formula: mathField.getValue('latex'),
    solucion: document.getElementById('ej-solucion').value,
    categoria: document.getElementById('ej-categoria').value,
    dificultad: document.getElementById('ej-dificultad').value,
    tags,
    imagenes: imagenesSubidas.length > 0 ? imagenesSubidas : undefined,
  };

  if (!body.titulo || !body.descripcion || !body.formula) {
    error.textContent = 'Título, descripción y fórmula son obligatorios';
    return;
  }

  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) { error.textContent = data.mensaje; return; }

    window.location.href = 'index.html';
  } catch {
    error.textContent = 'Error al guardar';
  }
}

// ===== ELIMINAR =====
async function eliminarEjercicio() {
  if (!confirm('¿Seguro que quieres eliminar este ejercicio? Esta acción no se puede deshacer.')) return;

  try {
    const res = await fetch(`${API}/ejercicios/${ejercicioId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });

    if (!res.ok) { alert('Error al eliminar'); return; }
    window.location.href = 'index.html';
  } catch {
    alert('Error al eliminar');
  }
}

// Tema
(function() {
  const tema = localStorage.getItem('tema');
  if (tema === 'claro') document.documentElement.classList.add('claro');
})();

// ===== IMÁGENES =====
async function previsualizarImagenes(event) {
  const files = Array.from(event.target.files).slice(0, 3);
  const preview = document.getElementById('imagenes-preview');
  imagenesSubidas = [];
  preview.innerHTML = '';

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'imagen-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="preview"/>
        <div class="imagen-preview-overlay">Subiendo...</div>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);

    // Subir al servidor
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetch(`${API}/uploads`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokenActual}` },
        body: formData
      });
      const data = await res.json();
      imagenesSubidas.push(data.url);

      // Actualizar overlay
      const items = preview.querySelectorAll('.imagen-preview-item');
      const overlay = items[imagenesSubidas.length - 1]?.querySelector('.imagen-preview-overlay');
      if (overlay) overlay.textContent = '✓ Subida';
    } catch {
      console.error('Error subiendo imagen');
    }
  }
}