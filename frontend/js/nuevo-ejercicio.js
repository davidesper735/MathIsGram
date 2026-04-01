const API = 'https://foromat-backend.onrender.com/api';
const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
const tokenActual = localStorage.getItem('token');
let imagenesSubidas = [];

// Redirigir si no está logueado
if (!usuarioActual) {
  alert('Debes iniciar sesión para publicar un ejercicio');
  window.location.href = 'index.html';
}

// ===== PREVIEW EN TIEMPO REAL =====
document.getElementById('ej-titulo').addEventListener('input', (e) => {
  const prev = document.getElementById('prev-titulo');
  prev.textContent = e.target.value || 'Título del ejercicio';
});

document.getElementById('ej-descripcion').addEventListener('input', (e) => {
  const prev = document.getElementById('prev-descripcion');
  prev.textContent = e.target.value || 'La descripción aparecerá aquí...';
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
  const prevTags = document.getElementById('prev-tags');
  prevTags.innerHTML = tags.map(t => `<span class="tag">#${t}</span>`).join('');
});

// Preview fórmula
const mathField = document.getElementById('ej-formula');
mathField.addEventListener('input', () => {
  const latex = mathField.getValue('latex');
  const prev = document.getElementById('prev-formula');
  prev.innerHTML = latex ? `\\(${latex}\\)` : '<span style="color:var(--text-muted)">La fórmula aparecerá aquí...</span>';
  MathJax.typesetPromise([prev]);
});

// ===== PUBLICAR =====
async function publicar() {
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
    imagenes: imagenesSubidas
  };

  if (!body.titulo || !body.descripcion || !body.formula) {
    error.textContent = 'Título, descripción y fórmula son obligatorios';
    return;
  }

  try {
    const res = await fetch(`${API}/ejercicios`, {
      method: 'POST',
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
    error.textContent = 'Error al publicar';
  }
}

// ===== TEMA =====
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