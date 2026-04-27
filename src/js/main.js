// ============================================================
// El ECG del Clínico — Lightbox + búsqueda + navegación
// ============================================================

// Detección de plataforma para mostrar Cmd vs Ctrl
const IS_MAC = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const META_KEY = IS_MAC ? '⌘' : 'Ctrl';

// ============================================================
// 1. Lightbox de imágenes con zoom/pan/descarga + navegación ←/→
// ============================================================
(function () {
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <div class="lb-toolbar">
      <div class="lb-controls">
        <button class="lb-btn" data-action="zoom-out" title="Reducir (−)" aria-label="Reducir">−</button>
        <span class="lb-zoom">100%</span>
        <button class="lb-btn" data-action="zoom-in" title="Ampliar (+)" aria-label="Ampliar">+</button>
        <button class="lb-btn" data-action="reset" title="Reiniciar (0)" aria-label="Reiniciar">⟲</button>
      </div>
      <div class="lb-title"></div>
      <div class="lb-actions">
        <span class="lb-counter"></span>
        <a class="lb-btn lb-download" download title="Descargar imagen" aria-label="Descargar">⬇</a>
        <a class="lb-btn lb-open" target="_blank" rel="noopener" title="Ver post original" aria-label="Ver post original">↗</a>
        <button class="lb-btn lb-close" title="Cerrar (Esc)" aria-label="Cerrar">×</button>
      </div>
    </div>
    <div class="lb-stage">
      <button class="lb-nav lb-prev" title="Imagen anterior (←)" aria-label="Imagen anterior">‹</button>
      <img class="lb-img" alt="">
      <button class="lb-nav lb-next" title="Imagen siguiente (→)" aria-label="Imagen siguiente">›</button>
    </div>
    <div class="lb-caption"></div>
  `;
  document.body.appendChild(lb);

  const stage = lb.querySelector('.lb-stage');
  const img = lb.querySelector('.lb-img');
  const zoomLabel = lb.querySelector('.lb-zoom');
  const titleEl = lb.querySelector('.lb-title');
  const dlBtn = lb.querySelector('.lb-download');
  const openBtn = lb.querySelector('.lb-open');
  const captionEl = lb.querySelector('.lb-caption');
  const prevBtn = lb.querySelector('.lb-prev');
  const nextBtn = lb.querySelector('.lb-next');
  const counterEl = lb.querySelector('.lb-counter');

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, startX, startY;
  let gallery = [];   // todas las .zoomable de la página
  let currentIdx = 0;

  const apply = (smooth = true) => {
    img.classList.toggle('no-trans', !smooth);
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomLabel.textContent = Math.round(scale * 100) + '%';
    img.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in';
  };
  const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };
  const zoom = (delta, smooth = true) => {
    const ns = Math.max(0.4, Math.min(8, +(scale + delta).toFixed(2)));
    if (ns === scale) return;
    scale = ns;
    if (scale <= 1) { tx = 0; ty = 0; }
    apply(smooth);
  };

  const buildDataFromImg = (z) => {
    const fig = z.closest('figure');
    return {
      src: z.currentSrc || z.src,
      alt: z.alt,
      title: z.dataset.title || (fig && fig.querySelector('.badge-real') ? fig.querySelector('.badge-real').textContent : ''),
      caption: z.dataset.caption || (fig && fig.querySelector('figcaption') ? fig.querySelector('figcaption').innerHTML : ''),
      post: z.dataset.post
    };
  };

  const showAt = (idx) => {
    if (!gallery.length) return;
    currentIdx = ((idx % gallery.length) + gallery.length) % gallery.length;
    const data = buildDataFromImg(gallery[currentIdx]);
    img.src = data.src;
    img.alt = data.alt || '';
    titleEl.textContent = data.title || '';
    captionEl.innerHTML = (data.caption || '') +
      (data.post ? `<span class="src">→ <a href="${data.post}" target="_blank" rel="noopener">Post original en Dr. Smith's ECG Blog</a></span>` : '');
    dlBtn.href = data.src;
    dlBtn.download = (data.src.split('/').pop() || 'ecg.png');
    openBtn.href = data.post || '#';
    openBtn.style.display = data.post ? '' : 'none';
    counterEl.textContent = gallery.length > 1 ? `${currentIdx + 1} / ${gallery.length}` : '';
    prevBtn.style.display = gallery.length > 1 ? '' : 'none';
    nextBtn.style.display = gallery.length > 1 ? '' : 'none';
    reset();
  };

  const open = (clickedZoomable) => {
    gallery = Array.from(document.querySelectorAll('.zoomable'));
    const idx = gallery.indexOf(clickedZoomable);
    if (idx < 0) return;
    showAt(idx);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', (e) => {
    const z = e.target.closest('.zoomable');
    if (!z) return;
    e.preventDefault();
    open(z);
  });

  lb.querySelector('.lb-close').addEventListener('click', close);
  stage.addEventListener('click', (e) => { if (e.target === stage) close(); });

  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showAt(currentIdx - 1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showAt(currentIdx + 1); });

  lb.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'zoom-in') zoom(0.25);
      if (a === 'zoom-out') zoom(-0.25);
      if (a === 'reset') reset();
    });
  });

  stage.addEventListener('wheel', (e) => {
    if (!lb.classList.contains('open')) return;
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.18 : 0.18, false);
  }, { passive: false });

  img.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (scale <= 1) { scale = 2.5; apply(); }
    else reset();
  });
  img.addEventListener('click', (e) => {
    if (scale <= 1 && !dragging) { e.stopPropagation(); zoom(1); }
  });

  img.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
    stage.classList.add('dragging');
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    apply(false);
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; stage.classList.remove('dragging'); apply(); }
  });

  let pinchDist = null, lastTouchX, lastTouchY;
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      pinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    } else if (e.touches.length === 1 && scale > 1) {
      lastTouchX = e.touches[0].clientX - tx;
      lastTouchY = e.touches[0].clientY - ty;
    }
  });
  stage.addEventListener('touchmove', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const d = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (pinchDist) zoom((d - pinchDist) * 0.005, false);
      pinchDist = d;
      e.preventDefault();
    } else if (e.touches.length === 1 && scale > 1 && lastTouchX != null) {
      tx = e.touches[0].clientX - lastTouchX;
      ty = e.touches[0].clientY - lastTouchY;
      apply(false);
      e.preventDefault();
    }
  }, { passive: false });
  stage.addEventListener('touchend', () => { pinchDist = null; lastTouchX = lastTouchY = null; });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') zoom(0.25);
    else if (e.key === '-' || e.key === '_') zoom(-0.25);
    else if (e.key === '0') reset();
    else if (e.key === 'ArrowLeft') showAt(currentIdx - 1);
    else if (e.key === 'ArrowRight') showAt(currentIdx + 1);
  });
})();

// ============================================================
// 2. Búsqueda interna (Cmd/Ctrl+K, /)
// ============================================================
(function () {
  // Si el índice no está cargado, no construir la UI
  if (!window.SEARCH_INDEX) return;

  // URLs ahora son absolutas desde el root (/cap/.../, /apendice/.../, /)
  const prefix = '';

  const norm = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const modal = document.createElement('div');
  modal.className = 'search-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="search-overlay"></div>
    <div class="search-panel">
      <div class="search-header">
        <span class="search-icon-input" aria-hidden="true">⌕</span>
        <input type="text" class="search-input" placeholder="Buscar capítulos, secciones o conceptos…" autocomplete="off" spellcheck="false">
        <kbd class="esc-kbd">esc</kbd>
      </div>
      <div class="search-results" role="listbox"></div>
      <div class="search-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd>navegar</span>
        <span><kbd>↵</kbd>abrir</span>
        <span><kbd>esc</kbd>cerrar</span>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const overlay = modal.querySelector('.search-overlay');
  const input = modal.querySelector('.search-input');
  const resultsEl = modal.querySelector('.search-results');

  let activeIdx = 0;
  let currentMatches = [];

  function highlight(text, query) {
    if (!query) return text;
    const nText = norm(text);
    const nQ = norm(query);
    const idx = nText.indexOf(nQ);
    if (idx < 0) return text;
    // Marcar respetando los caracteres originales
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  function score(entry, q) {
    const nQ = norm(q);
    if (!nQ) return -1;
    let best = 0;

    if (norm(entry.title).includes(nQ)) best = Math.max(best, 100);
    if (norm(entry.chapter).includes(nQ)) best = Math.max(best, 90);

    // Soporte sections=[{id,title}] (nuevo) y sections=[string] (legacy)
    let sectionMatch = null;
    for (const s of entry.sections || []) {
      const sTitle = typeof s === 'string' ? s : s.title;
      const sId = typeof s === 'string' ? '' : s.id;
      if (norm(sTitle).includes(nQ)) {
        best = Math.max(best, 80);
        if (!sectionMatch) sectionMatch = { title: sTitle, id: sId };
      }
    }

    for (const k of entry.keywords || []) {
      if (norm(k).includes(nQ)) best = Math.max(best, 60);
    }

    return best > 0 ? { score: best, entry, sectionMatch } : null;
  }

  function performSearch(q) {
    if (!q.trim()) {
      resultsEl.innerHTML = '';
      currentMatches = [];
      return;
    }
    const matches = window.SEARCH_INDEX
      .map(e => score(e, q))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    currentMatches = matches;
    activeIdx = 0;
    renderResults(q);
  }

  function renderResults(q) {
    if (!currentMatches.length) {
      resultsEl.innerHTML = '<div class="search-empty">Sin resultados para "' + q + '"</div>';
      return;
    }
    let html = '';
    let lastPart = '';
    currentMatches.forEach((m, i) => {
      const e = m.entry;
      if (e.part !== lastPart) {
        html += `<div class="group-label">${e.part}</div>`;
        lastPart = e.part;
      }
      // Deep-link directo a la sección si hay match con anchor (#id)
      const anchor = m.sectionMatch && m.sectionMatch.id ? `#${m.sectionMatch.id}` : '';
      const url = prefix + e.url + anchor;
      const titleH = highlight(e.title, q);
      const sectionH = m.sectionMatch ? highlight(m.sectionMatch.title, q) : '';
      const sectionLine = sectionH
        ? `<div class="res-section"><span class="sep">↳</span> ${sectionH}</div>`
        : `<div class="res-section">${e.part}</div>`;
      html += `
        <a class="search-result${i === activeIdx ? ' active' : ''}" data-idx="${i}" href="${url}">
          <span class="badge">${e.chapter}</span>
          <div class="body">
            <div class="res-title">${titleH}</div>
            ${sectionLine}
          </div>
          <span class="res-arrow">→</span>
        </a>
      `;
    });
    resultsEl.innerHTML = html;

    // Click activa el resultado
    resultsEl.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('mouseenter', () => {
        activeIdx = parseInt(el.dataset.idx, 10);
        updateActive();
      });
    });
  }

  function updateActive() {
    resultsEl.querySelectorAll('.search-result').forEach((el, i) => {
      el.classList.toggle('active', i === activeIdx);
    });
    const active = resultsEl.querySelector('.search-result.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function activate(idx) {
    const m = currentMatches[idx];
    if (!m) return;
    const anchor = m.sectionMatch && m.sectionMatch.id ? `#${m.sectionMatch.id}` : '';
    window.location = prefix + m.entry.url + anchor;
  }

  window.openSearch = function () {
    modal.classList.add('open');
    input.value = '';
    resultsEl.innerHTML = '';
    setTimeout(() => input.focus(), 50);
    document.body.style.overflow = 'hidden';
  };
  function closeSearch() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', closeSearch);
  input.addEventListener('input', () => performSearch(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMatches.length) {
        activeIdx = (activeIdx + 1) % currentMatches.length;
        updateActive();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentMatches.length) {
        activeIdx = (activeIdx - 1 + currentMatches.length) % currentMatches.length;
        updateActive();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(activeIdx);
    }
  });

  // Atajo global: Cmd/Ctrl+K o /
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      window.openSearch();
    } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      window.openSearch();
    }
  });
})();

// ============================================================
// 3. Atajos de capítulo: ←/→ entre capítulos + barra de progreso
//    + sidebar móvil + capítulo activo
// ============================================================
(function () {
  // Marca el capítulo activo en el sidebar
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.toc a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop().toLowerCase();
    if (href === path) a.classList.add('active');
  });

  // Sidebar móvil
  const btn = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !btn.contains(e.target)) sidebar.classList.remove('open');
    });
  }

  // Atajos: flechas entre capítulos (solo si NO hay modal/lightbox abierto)
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (document.querySelector('.lightbox.open')) return; // lightbox tiene sus propias flechas
    if (document.querySelector('.search-modal.open')) return; // search también
    const prev = document.querySelector('.chapter-nav .prev');
    const next = document.querySelector('.chapter-nav .next');
    if (e.key === 'ArrowLeft' && prev) window.location = prev.href;
    if (e.key === 'ArrowRight' && next) window.location = next.href;
  });

  // Barra de progreso de lectura
  const bar = document.querySelector('.progress > span');
  if (bar) {
    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      bar.style.width = pct + '%';
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }
})();

// ============================================================
// 4. Botón "volver arriba"
// ============================================================
(function () {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.title = 'Volver arriba';
  btn.innerHTML = '↑';
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(btn);
  document.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
})();

// ============================================================
// 5. Hint flotante de atajo de búsqueda (primera visita)
// ============================================================
(function () {
  if (!window.SEARCH_INDEX) return;
  // Mostrar solo una vez
  try {
    if (localStorage.getItem('ecg-shortcut-hint-shown')) return;
  } catch (e) { return; }

  const hint = document.createElement('div');
  hint.className = 'shortcut-hint';
  hint.innerHTML = `
    <span>Pulsa <kbd>${META_KEY}</kbd>+<kbd>K</kbd> o <kbd>/</kbd> para buscar</span>
    <button class="close-hint" aria-label="Cerrar aviso">×</button>
  `;
  document.body.appendChild(hint);
  setTimeout(() => hint.classList.add('show'), 1500);

  const dismiss = () => {
    hint.classList.remove('show');
    try { localStorage.setItem('ecg-shortcut-hint-shown', '1'); } catch (e) {}
    setTimeout(() => hint.remove(), 400);
  };
  hint.querySelector('.close-hint').addEventListener('click', dismiss);
  setTimeout(dismiss, 8000);
})();

// ============================================================
// 6. Actualiza el kbd label en el botón de búsqueda según OS
// ============================================================
(function () {
  document.querySelectorAll('.topbtn-search .search-kbd').forEach(el => {
    el.textContent = META_KEY + 'K';
  });
})();
