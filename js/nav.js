// ============================================================
// Lightbox de imágenes ECG con zoom/pan/descarga
// ============================================================
(function () {
  // Construye el DOM una sola vez
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
        <a class="lb-btn lb-download" download title="Descargar imagen" aria-label="Descargar">⬇</a>
        <a class="lb-btn lb-open" target="_blank" rel="noopener" title="Ver post original" aria-label="Ver post original">↗</a>
        <button class="lb-btn lb-close" title="Cerrar (Esc)" aria-label="Cerrar">×</button>
      </div>
    </div>
    <div class="lb-stage">
      <img class="lb-img" alt="">
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

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, startX, startY;

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

  const open = (data) => {
    img.src = data.src;
    img.alt = data.alt || '';
    titleEl.textContent = data.title || '';
    captionEl.innerHTML = (data.caption || '') +
      (data.post ? `<span class="src">→ <a href="${data.post}" target="_blank" rel="noopener">Post original en Dr. Smith's ECG Blog</a></span>` : '');
    dlBtn.href = data.src;
    dlBtn.download = (data.src.split('/').pop() || 'ecg.png');
    openBtn.href = data.post || '#';
    openBtn.style.display = data.post ? '' : 'none';
    reset();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Click en cualquier .zoomable abre el visor
  document.addEventListener('click', (e) => {
    const z = e.target.closest('.zoomable');
    if (!z) return;
    e.preventDefault();
    const fig = z.closest('figure');
    open({
      src: z.currentSrc || z.src,
      alt: z.alt,
      title: z.dataset.title || (fig && fig.querySelector('.badge-real') ? fig.querySelector('.badge-real').textContent : ''),
      caption: z.dataset.caption || (fig && fig.querySelector('figcaption') ? fig.querySelector('figcaption').innerHTML : ''),
      post: z.dataset.post
    });
  });

  // Cerrar
  lb.querySelector('.lb-close').addEventListener('click', close);
  stage.addEventListener('click', (e) => { if (e.target === stage) close(); });

  // Toolbar
  lb.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action;
      if (a === 'zoom-in') zoom(0.25);
      if (a === 'zoom-out') zoom(-0.25);
      if (a === 'reset') reset();
    });
  });

  // Wheel = zoom
  stage.addEventListener('wheel', (e) => {
    if (!lb.classList.contains('open')) return;
    e.preventDefault();
    zoom(e.deltaY > 0 ? -0.18 : 0.18, false);
  }, { passive: false });

  // Doble clic = toggle zoom
  img.addEventListener('dblclick', (e) => {
    e.preventDefault();
    if (scale <= 1) { scale = 2.5; apply(); }
    else reset();
  });

  // Click simple sobre la imagen al 100% = ampliar a 2x
  img.addEventListener('click', (e) => {
    if (scale <= 1 && !dragging) { e.stopPropagation(); zoom(1); }
  });

  // Drag para pan
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

  // Pinch zoom y pan táctil
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

  // Atajos de teclado
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') zoom(0.25);
    else if (e.key === '-' || e.key === '_') zoom(-0.25);
    else if (e.key === '0') reset();
  });
})();

// ============================================================
// El ECG del Clínico — navegación general
// ============================================================
(function () {
  // Marca el capítulo activo
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.toc a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop().toLowerCase();
    if (href === path) a.classList.add('active');
  });

  // Toggle del sidebar móvil
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

  // Atajos de teclado: ←/→
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
