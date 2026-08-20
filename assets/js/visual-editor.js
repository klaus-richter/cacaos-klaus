// visual-editor.js — Motor interactivo estilo PowerPoint/Word con selector de color y formato
(function () {
  let isEditing = true;

  // Inyectar Barra de Herramientas Superior
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

  // Inyectar Mini Barra Flotante de Formato (Color / Negrita / Resaltado)
  const floatingToolbar = document.createElement('div');
  floatingToolbar.id = 've-floating-toolbar';
  floatingToolbar.innerHTML = `
    <div class="ve-color-wrapper" title="Color de la letra">
      <label>
        <span class="ve-color-preview" id="ve-preview-text-color"></span>
        🎨 Letra
        <input type="color" class="ve-color-input" id="ve-text-color-picker" value="#2D8F4E" />
      </label>
    </div>
    <div class="ve-color-wrapper" title="Color de resaltado / fondo">
      <label>
        <span class="ve-color-preview" id="ve-preview-bg-color" style="background:#ffea79;"></span>
        🟡 Resaltar
        <input type="color" class="ve-color-input" id="ve-bg-color-picker" value="#ffea79" />
      </label>
    </div>
    <button class="ve-tool-btn" id="ve-btn-bold" title="Negrita"><b>B</b></button>
    <button class="ve-tool-btn" id="ve-btn-italic" title="Cursiva"><i>I</i></button>
    <button class="ve-tool-btn" id="ve-btn-clear" title="Quitar formato">🧹</button>
  `;
  document.body.appendChild(floatingToolbar);

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
      if (el.closest('#visual-editor-bar') || el.closest('#ve-modal') || el.closest('#ve-floating-toolbar')) return;
      el.setAttribute('contenteditable', active ? 'true' : 'false');
      el.setAttribute('spellcheck', 'false');
    });

    if (!active) {
      floatingToolbar.style.display = 'none';
    }
  }

  // Activar por defecto
  setEditingState(true);

  // Eventos de la barra superior
  document.getElementById('ve-toggle-mode').addEventListener('click', () => {
    setEditingState(!isEditing);
  });

  // --- GESTIÓN DE SELECCIÓN Y BARRA FLOTANTE (Formato y Color) ---
  let savedRange = null;

  function updateFloatingToolbarPosition() {
    if (!isEditing) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      floatingToolbar.style.display = 'none';
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (text.length === 0) {
      floatingToolbar.style.display = 'none';
      return;
    }

    savedRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    floatingToolbar.style.display = 'flex';
    const top = rect.top + window.scrollY - 46;
    const left = rect.left + window.scrollX + (rect.width / 2) - (floatingToolbar.offsetWidth / 2);

    floatingToolbar.style.top = Math.max(60, top) + 'px';
    floatingToolbar.style.left = Math.max(10, left) + 'px';
  }

  document.addEventListener('mouseup', () => {
    setTimeout(updateFloatingToolbarPosition, 10);
  });

  document.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(updateFloatingToolbarPosition, 10);
    }
  });

  function restoreSelection() {
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  }

  // Color de Letra
  const textColorPicker = document.getElementById('ve-text-color-picker');
  const textColorPreview = document.getElementById('ve-preview-text-color');
  textColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    textColorPreview.style.background = color;
    restoreSelection();
    document.execCommand('foreColor', false, color);
    if (savedRange) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) savedRange = selection.getRangeAt(0).cloneRange();
    }
  });

  // Color de Fondo / Resaltador
  const bgColorPicker = document.getElementById('ve-bg-color-picker');
  const bgColorPreview = document.getElementById('ve-preview-bg-color');
  bgColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    bgColorPreview.style.background = color;
    restoreSelection();
    document.execCommand('hiliteColor', false, color);
    if (savedRange) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) savedRange = selection.getRangeAt(0).cloneRange();
    }
  });

  // Negrita
  document.getElementById('ve-btn-bold').addEventListener('click', () => {
    restoreSelection();
    document.execCommand('bold', false, null);
  });

  // Cursiva
  document.getElementById('ve-btn-italic').addEventListener('click', () => {
    restoreSelection();
    document.execCommand('italic', false, null);
  });

  // Quitar formato
  document.getElementById('ve-btn-clear').addEventListener('click', () => {
    restoreSelection();
    document.execCommand('removeFormat', false, null);
  });

  // Evitar que hacer clic en los botones de la barra flotante deseleccione el texto
  floatingToolbar.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  // --- EXPORTAR / GUARDAR ---
  function getCleanHTML() {
    const clone = document.documentElement.cloneNode(true);
    
    // Remover elementos inyectados del editor
    const editorBar = clone.querySelector('#visual-editor-bar');
    if (editorBar) editorBar.remove();
    const editorModal = clone.querySelector('#ve-modal');
    if (editorModal) editorModal.remove();
    const toolbar = clone.querySelector('#ve-floating-toolbar');
    if (toolbar) toolbar.remove();

    // Limpiar estilos del body
    const body = clone.querySelector('body');
    if (body) {
      body.classList.remove('ve-editing-mode');
      body.style.paddingTop = '';
    }

    // Quitar contenteditable
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
      '✅ Archivo index.html Generado con tus Colores',
      'Tu archivo con todos los colores y textos editados se ha descargado. Reemplázalo en tu carpeta del proyecto.',
      'powershell -ExecutionPolicy Bypass -File .\\publish.ps1'
    );
  });

  // Publicar modal
  document.getElementById('ve-publish-btn').addEventListener('click', () => {
    showModal(
      '🚀 Publicar cambios a GitHub Pages',
      'Guarda tu archivo o corre el script de 1 clic <code>publish.bat</code> en tu carpeta para sincronizar automáticamente con tu web en internet:',
      '.\\publish.bat'
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
