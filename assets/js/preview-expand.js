// assets/js/preview-expand.js
(() => {
  // Ensure a root exists to mount overlay
  const root = document.getElementById('preview-root') || (() => {
    const d = document.createElement('div');
    d.id = 'preview-root';
    document.body.appendChild(d);
    return d;
  })();

  // === Inject styles for overlay + swiper gallery (no FLIP) ===
  const style = document.createElement('style');
  style.textContent = `
    .preview-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.55);
      opacity: 0; transition: opacity .18s ease; z-index: 60;
    }
    .preview-backdrop.show { opacity: 1; }

    .preview-close {
      position: fixed; top: 1rem; right: 1rem; z-index: 75;
      background: rgba(255,255,255,.9); border: 0; border-radius: 9999px; width: 2.5rem; height: 2.5rem;
      display: grid; place-items: center; box-shadow: 0 2px 8px rgba(0,0,0,.18); cursor: pointer;
    }
    .preview-close:focus { outline: 2px solid #111827; outline-offset: 2px; }

    .preview-stage { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; pointer-events: none; }
    .preview-frame { position: relative; pointer-events: auto; width: min(96vw, 1200px); max-height: 90vh; }

    /* Swiper gallery */
    .preview-swiper { width: min(96vw, 1200px); height: auto; max-height: 90vh; }
    .preview-swiper .swiper-wrapper { align-items: center; }
    .preview-swiper .swiper-slide {
      display: grid; place-items: center;
      padding: 8px 8px 28px 8px; /* room above dots */
      box-sizing: border-box;
    }

    /* Images: NEVER upscale; only shrink to fit frame */
    .preview-swiper .swiper-slide img {
      max-width: 100%;
      max-height: 80vh;   /* leave room for arrows/dots */
      width: auto;
      height: auto;
      border-radius: 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
    }

    /* Controls */
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

    body.preview-lock { overflow: hidden; }
  `;
  document.head.appendChild(style);

  // ----------- Gallery sources -----------

  // Manifest JSON loader (no API, just a static file next to images)
  async function loadManifest(btn) {
    const url = btn.getAttribute('data-gallery-manifest');
    if (!url) return null;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      if (!json || !Array.isArray(json.images)) return null;
      const base = url.replace(/[^/]+$/, ''); // folder of manifest
      const imgs = json.images.map(name => (name.match(/^https?:\/\//) ? name : base + name));
      return { title: json.title || '', images: imgs };
    } catch (e) {
      console.error('preview manifest load failed:', e);
      return null;
    }
  }

  // Inline list or single file
  function parseInline(btn) {
    const inline = (btn.getAttribute('data-gallery') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (inline.length) return { title: btn.getAttribute('data-alt') || '', images: inline };
    const single = btn.getAttribute('data-fullsrc');
    return single ? { title: btn.getAttribute('data-alt') || '', images: [single] } : null;
  }

  async function getGallery(btn) {
    // Priority: manifest.json > inline list > single
    const manifest = await loadManifest(btn);
    if (manifest) return manifest;
    const inline = parseInline(btn);
    return inline;
  }

  // ----------- Overlay (no FLIP) -----------

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

    // Mount
    root.innerHTML = '';
    root.appendChild(backdrop);
    root.appendChild(stage);
    stage.appendChild(frame);
    frame.appendChild(swiperEl);
    root.appendChild(closeBtn);

    // Lock scroll and fade in
    document.body.classList.add('preview-lock');
    requestAnimationFrame(() => { backdrop.classList.add('show'); });

    // Init Swiper
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

    // Close behavior
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
    const alt = meta.title || btn.getAttribute('data-alt') || 'Preview';
    openPreview(meta.images, alt);
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
