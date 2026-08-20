// visual-editor.js — Motor interactivo estilo PowerPoint/Word con Guardado y Publicación Automática 1-Clic
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
      <button class="ve-btn ve-btn-publish" id="ve-save-publish-btn" style="background:#2D8F4E; font-size:13px; padding:7px 18px;">
        🚀 Guardar y Publicar en Vivo
      </button>
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
      <h3 id="ve-modal-title">🎉 ¡Publicado Exitosamente!</h3>
      <p id="ve-modal-desc">Tus cambios se han guardado localmente y se han subido a GitHub Pages por detrás.</p>
      <pre id="ve-modal-code">https://klaus-richter.github.io/cacaos-klaus/</pre>
      <div class="ve-modal-actions">
        <button class="ve-btn ve-btn-publish" id="ve-modal-action" style="background:#2D8F4E;">Ver mi web en vivo ↗</button>
        <button class="ve-btn ve-btn-mode" id="ve-modal-close">Cerrar</button>
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

  floatingToolbar.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  // --- OBTENER HTML LIMPIO ---
  function getCleanHTML() {
    const clone = document.documentElement.cloneNode(true);
    
    const editorBar = clone.querySelector('#visual-editor-bar');
    if (editorBar) editorBar.remove();
    const editorModal = clone.querySelector('#ve-modal');
    if (editorModal) editorModal.remove();
    const toolbar = clone.querySelector('#ve-floating-toolbar');
    if (toolbar) toolbar.remove();

    const body = clone.querySelector('body');
    if (body) {
      body.classList.remove('ve-editing-mode');
      body.style.paddingTop = '';
    }

    clone.querySelectorAll('[contenteditable]').forEach((el) => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });

    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  // --- BOTÓN PRINCIPAL: GUARDAR Y PUBLICAR POR DETRÁS (1 CLIC) ---
  const savePublishBtn = document.getElementById('ve-save-publish-btn');
  savePublishBtn.addEventListener('click', async () => {
    const html = getCleanHTML();
    const originalText = savePublishBtn.innerHTML;
    savePublishBtn.innerHTML = '⏳ Guardando y publicando a GitHub...';
    savePublishBtn.style.opacity = '0.7';
    savePublishBtn.disabled = true;

    try {
      // Intentar enviar al backend local
      const res = await fetch('/api/save-and-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: html
      });

      if (res.ok) {
        const data = await res.json();
        showModal(
          '🎉 ¡Todo listo y publicado por detrás!',
          'Tus cambios se guardaron automáticamente en tu <code>index.html</code> y se subieron a GitHub Pages.',
          'https://klaus-richter.github.io/cacaos-klaus/'
        );
      } else {
        throw new Error('Servidor local no disponible');
      }
    } catch (err) {
      // Fallback si no está corriendo el servidor local (ej. abrió como archivo directo)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      a.click();
      URL.revokeObjectURL(url);

      showModal(
        '💾 Guardado local (Archivo descargado)',
        'Para que la subida sea 100% automática en 1 clic sin descargar archivos, inicia el editor abriendo <code>abrir-editor.bat</code>.',
        '.\\publish.bat'
      );
    } finally {
      savePublishBtn.innerHTML = originalText;
      savePublishBtn.style.opacity = '1';
      savePublishBtn.disabled = false;
    }
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
    window.open('https://klaus-richter.github.io/cacaos-klaus/', '_blank');
  });
})();
