(() => {
  // --- Lazy-load Swiper assets if not present ---
  const SWIPER_CSS = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
  const SWIPER_JS = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";

  function ensureSwiper() {
    return new Promise((resolve, reject) => {
      // If Swiper already available, done.
      if (window.Swiper) return resolve();

      // Inject CSS once
      if (!document.querySelector('link[data-swiper="css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = SWIPER_CSS;
        l.setAttribute('data-swiper', 'css');
        document.head.appendChild(l);
      }

      // Inject JS once
      let s = document.querySelector('script[data-swiper="js"]');
      if (s && s.dataset.loaded === "true") return resolve();

      if (!s) {
        s = document.createElement('script');
        s.src = SWIPER_JS;
        s.defer = true;
        s.setAttribute('data-swiper', 'js');
        document.head.appendChild(s);
      }

      s.addEventListener('load', () => {
        s.dataset.loaded = "true";
        resolve();
      }, { once: true });
      s.addEventListener('error', reject, { once: true });
    });
  }

  // Ensure a root exists to mount overlay
  const root = document.getElementById('preview-root') || (() => {
    const d = document.createElement('div');
    d.id = 'preview-root';
    document.body.appendChild(d);
    return d;
  })();

  // Styles for overlay + swiper gallery
  const style = document.createElement('style');
  style.textContent = `
    .preview-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); opacity: 0; transition: opacity .18s ease; z-index: 60; }
    .preview-backdrop.show { opacity: 1; }

    .preview-close { position: fixed; top: 1rem; right: 1rem; z-index: 75; background: rgba(255,255,255,.9); border: 0; border-radius: 9999px; width: 2.5rem; height: 2.5rem; display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,.18); cursor: pointer; }
    .preview-close:focus { outline: 2px solid #111827; outline-offset: 2px; }

    .preview-stage { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; pointer-events: none; }
    .preview-frame { position: relative; pointer-events: auto; width: min(96vw, 1200px); max-height: 90vh; }

    .preview-swiper { width: min(96vw, 1200px); height: auto; max-height: 90vh; }
    .preview-swiper .swiper-wrapper { align-items: center; }
    .preview-swiper .swiper-slide { display: grid; place-items: center; padding: 8px 8px 28px 8px; box-sizing: border-box; }

    .preview-swiper .swiper-slide img {
      max-width: 100%;
      max-height: 80vh;
      width: auto;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
    }

    .preview-swiper .swiper-button-prev, .preview-swiper .swiper-button-next {
      color: #111827;
      width: 2.75rem; height: 2.75rem; border-radius: 9999px;
      background: rgba(255,255,255,.85); backdrop-filter: blur(8px);
      box-shadow: 0 2px 8px rgba(0,0,0,.18);
    }
    .preview-swiper .swiper-button-prev::after, .preview-swiper .swiper-button-next::after {
      font-size: 1.25rem; font-weight: 700;
    }
    .preview-swiper .swiper-pagination-bullets { bottom: 6px !important; }

    /* Pagination bullets (scoped to the preview modal) */
    .preview-swiper .swiper-pagination-bullet {
      width: 10px;
      height: 10px;
      background: #22d3ee;                 /* cyan-400 (inactive) */
      opacity: 0.9;
      box-shadow: 0 0 0 2px rgba(34,211,238,.25);
      transition: transform .15s ease, background-color .15s ease, box-shadow .15s ease;
    }

    .preview-swiper .swiper-pagination-bullet-active {
      background: #f59e0b;                 /* amber-500 (active) */
      opacity: 1;
      transform: scale(1.25);
      box-shadow: 0 0 0 3px rgba(245,158,11,.35);  /* stronger halo */
    }

    body.preview-lock { overflow: hidden; }
  `;
  document.head.appendChild(style);

  // ----------- Gallery sources -----------
  async function loadManifest(btn) {
    const url = btn.getAttribute('data-gallery-manifest');
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      if (!json || !Array.isArray(json.images)) return null;
      const base = url.replace(/[^/]+$/, '');
      const imgs = json.images.map(name => (name.match(/^https?:\/\//) ? name : base + name));
      return { title: json.title || '', images: imgs };
    } catch (e) {
      console.error('preview manifest load failed:', e);
      return null;
    }
  }

  function parseInline(btn) {
    const inline = (btn.getAttribute('data-gallery') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (inline.length) return { title: btn.getAttribute('data-alt') || '', images: inline };
    const single = btn.getAttribute('data-fullsrc');
    return single ? { title: btn.getAttribute('data-alt') || '', images: [single] } : null;
  }

  async function getGallery(btn) {
    const manifest = await loadManifest(btn);
    if (manifest) return manifest;
    return parseInline(btn);
  }

  // ----------- Overlay -----------
  function openPreview(galleryUrls, alt) {
    const backdrop = document.createElement('div'); backdrop.className = 'preview-backdrop';
    const stage = document.createElement('div'); stage.className = 'preview-stage';
    const frame = document.createElement('div'); frame.className = 'preview-frame';

    const swiperEl = document.createElement('div');
    swiperEl.className = 'preview-swiper swiper';
    swiperEl.innerHTML = `
      <div class="swiper-wrapper">
        ${galleryUrls.map(src => `<div class="swiper-slide"><img src="${src}" alt="${alt || 'Preview'}"></div>`).join('')}
      </div>
      <div class="swiper-pagination"></div>
      <div class="swiper-button-prev"></div>
      <div class="swiper-button-next"></div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'preview-close';
    closeBtn.setAttribute('aria-label', 'Close preview');
    closeBtn.innerHTML = '✕';

    root.innerHTML = '';
    root.appendChild(backdrop);
    root.appendChild(stage);
    stage.appendChild(frame);
    frame.appendChild(swiperEl);
    root.appendChild(closeBtn);

    document.body.classList.add('preview-lock');
    requestAnimationFrame(() => { backdrop.classList.add('show'); });

    // Now safe to init Swiper (assets ensured beforehand)
    const sw = new Swiper(swiperEl, {
      slidesPerView: 1,
      spaceBetween: 16,
      loop: false,
      centeredSlides: false,
      initialSlide: 0,
      pagination: { el: swiperEl.querySelector('.swiper-pagination'), clickable: true },
      navigation: {
        nextEl: swiperEl.querySelector('.swiper-button-next'),
        prevEl: swiperEl.querySelector('.swiper-button-prev')
      },
      keyboard: { enabled: true }
    });

    function close() {
      backdrop.classList.remove('show');
      setTimeout(() => {
        root.innerHTML = '';
        document.body.classList.remove('preview-lock');
      }, 180);
    }
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, { once: true });
  }

  // ----------- Wiring -----------
  async function onPreviewClick(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const meta = await getGallery(btn);
    if (!meta || !meta.images || !meta.images.length) return;

    // Make sure Swiper is present before opening
    try {
      await ensureSwiper();
      openPreview(meta.images, meta.title || btn.getAttribute('data-alt') || 'Preview');
    } catch (err) {
      console.error('Failed to load Swiper:', err);
    }
  }

  function bindAll() {
    document.querySelectorAll('.preview-btn').forEach(btn => {
      if (btn.__boundPreview) return;
      btn.__boundPreview = true;
      btn.addEventListener('click', onPreviewClick);
    });
  }

  document.addEventListener('DOMContentLoaded', bindAll);
  document.addEventListener('includes:loaded', bindAll);
})();
