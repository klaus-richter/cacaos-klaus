// visual-editor.js — Motor interactivo estilo PowerPoint/Word
(function () {
  let isEditing = true;

  // Inyectar Barra de Herramientas
  const bar = document.createElement('div');
  bar.id = 'visual-editor-bar';
  bar.innerHTML = `
    <div class="ve-logo">
      ✨ MODO EDITOR VISUAL <span>PowerPoint Style</span>
    </div>
    <div class="ve-controls">
      <button class="ve-btn ve-btn-mode active" id="ve-toggle-mode">✏️ Modo Edición: ON</button>
      <button class="ve-btn ve-btn-save" id="ve-save-btn">💾 Descargar index.html</button>
      <button class="ve-btn ve-btn-publish" id="ve-publish-btn">🚀 Publicar a GitHub Pages</button>
    </div>
  `;
  document.body.appendChild(bar);

  // Inyectar modal
  const modal = document.createElement('div');
  modal.className = 've-modal-overlay';
  modal.id = 've-modal';
  modal.innerHTML = `
    <div class="ve-modal-card">
      <h3 id="ve-modal-title">💾 Guardar Cambios</h3>
      <p id="ve-modal-desc">Has editado la página visualmente. Puedes descargar tu nuevo <code>index.html</code> o ejecutar el comando de sincronización.</p>
      <pre id="ve-modal-code">git add index.html && git commit -m "update: cambios visuales" && git push</pre>
      <div class="ve-modal-actions">
        <button class="ve-btn ve-btn-mode" id="ve-modal-close">Cerrar</button>
        <button class="ve-btn ve-btn-save" id="ve-modal-action">Aceptar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Offset superior para que la barra no tape el header
  document.body.style.paddingTop = '52px';

  // Habilitar editable en todos los textos clave
  const editableSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p',
    '.btn', '.site-logo', '.product-card__name',
    '.product-card__desc', '.product-card__price',
    '.product-card__badge', '.announcement-bar__item',
    '.marquee-item', '.usp-title', '.usp-desc'
  ];

  function setEditingState(active) {
    isEditing = active;
    document.body.classList.toggle('ve-editing-mode', active);
    const btn = document.getElementById('ve-toggle-mode');
    if (btn) {
      btn.classList.toggle('active', active);
      btn.innerHTML = active ? '✏️ Modo Edición: ON' : '👁️ Vista Previa: OFF';
    }

    const els = document.querySelectorAll(editableSelectors.join(','));
    els.forEach((el) => {
      // No hacer editable la barra del editor
      if (el.closest('#visual-editor-bar') || el.closest('#ve-modal')) return;
      el.setAttribute('contenteditable', active ? 'true' : 'false');
      el.setAttribute('spellcheck', 'false');
    });
  }

  // Activar por defecto
  setEditingState(true);

  // Eventos de la barra
  document.getElementById('ve-toggle-mode').addEventListener('click', () => {
    setEditingState(!isEditing);
  });

  // Función para obtener el HTML limpio (sin los elementos del editor)
  function getCleanHTML() {
    // Desactivar temporalmente contenteditable
    const clone = document.documentElement.cloneNode(true);
    
    // Remover elementos del editor del clon
    const editorBar = clone.querySelector('#visual-editor-bar');
    if (editorBar) editorBar.remove();
    const editorModal = clone.querySelector('#ve-modal');
    if (editorModal) editorModal.remove();

    // Limpiar estilos y atributos inyectados en el body
    const body = clone.querySelector('body');
    if (body) {
      body.classList.remove('ve-editing-mode');
      body.style.paddingTop = '';
    }

    // Quitar contenteditable de todos los elementos
    clone.querySelectorAll('[contenteditable]').forEach((el) => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });

    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  // Descargar archivo
  document.getElementById('ve-save-btn').addEventListener('click', () => {
    const html = getCleanHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);

    showModal(
      '✅ Archivo index.html Generado',
      'Tu archivo con todos los textos editados se ha descargado. Reemplázalo en tu carpeta del proyecto.',
      'powershell -ExecutionPolicy Bypass -File .\\publish.ps1'
    );
  });

  // Modal publicar
  document.getElementById('ve-publish-btn').addEventListener('click', () => {
    // También guardamos automáticamente en localStorage por seguridad
    const html = getCleanHTML();
    localStorage.setItem('cacaos_klaus_last_edit', html);

    showModal(
      '🚀 Publicar cambios a GitHub Pages',
      'Guarda tu archivo o corre el script de 1 clic <code>publish.ps1</code> en tu terminal para sincronizar automáticamente con tu web en internet:',
      '.\\publish.ps1'
    );
  });

  function showModal(title, desc, code) {
    document.getElementById('ve-modal-title').innerHTML = title;
    document.getElementById('ve-modal-desc').innerHTML = desc;
    document.getElementById('ve-modal-code').innerText = code;
    modal.classList.add('open');
  }

  document.getElementById('ve-modal-close').addEventListener('click', () => {
    modal.classList.remove('open');
  });
  document.getElementById('ve-modal-action').addEventListener('click', () => {
    modal.classList.remove('open');
  });
})();
