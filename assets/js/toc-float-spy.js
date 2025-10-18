// /assets/js/toc-float-spy.js
(() => {
  const STICKY_OFFSET  = 80;   // float clamp under header
  const PROBE_FRACTION = 0.45; // probe ~middle of viewport

  const nav = document.getElementById('toc-nav');
  const overview = document.getElementById('overview');
  if (!nav || !overview) return;

  // --- Float beside Overview ---
  let tickingTop = false;
  function computeTop() {
    const y = overview.getBoundingClientRect().top + window.scrollY;
    return Math.max(STICKY_OFFSET, y - window.scrollY);
  }
  function applyTop() { nav.style.top = computeTop() + 'px'; tickingTop = false; }
  function onScrollTop() { if (!tickingTop) { requestAnimationFrame(applyTop); tickingTop = true; } }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nav.style.transition = 'top .18s ease-out';
  }

  // --- Active section via midpoints ---
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const ids = links.map(a => a.getAttribute('href')).filter(Boolean);
  const sections = ids.map(id => document.querySelector(id)).filter(Boolean);
  const linkById = Object.fromEntries(links.map(a => [a.getAttribute('href'), a]));

  function clearActive() { links.forEach(l => l.classList.remove('text-gray-900', 'font-semibold')); }
  let lastActiveId = null;
  function setActiveById(id) {
    if (!id || id === lastActiveId) return;
    const link = linkById[id];
    if (!link) return;
    clearActive();
    link.classList.add('text-gray-900', 'font-semibold');
    lastActiveId = id;
  }

  let positions = []; // [{ id, top }]
  let borders = [];   // midpoints

  function recalcPositions() {
    positions = sections.map(sec => ({
      id: '#' + sec.id,
      top: sec.getBoundingClientRect().top + window.scrollY
    })).sort((a, b) => a.top - b.top);

    borders = [];
    for (let i = 0; i < positions.length - 1; i++) {
      borders.push((positions[i].top + positions[i + 1].top) / 2);
    }
  }

  function pickByMidpoints(probeY) {
    if (!positions.length) return null;
    if (!borders.length || probeY < borders[0]) return positions[0].id;
    if (probeY >= borders[borders.length - 1]) return positions[positions.length - 1].id;
    const idx = borders.findIndex(b => probeY < b);
    return positions[idx].id;
  }

  let tickingSpy = false;
  function onScrollSpy() {
    if (tickingSpy) return;
    tickingSpy = true;
    requestAnimationFrame(() => {
      const probeY = window.scrollY + window.innerHeight * PROBE_FRACTION;

      // Only activate Conclusion once its top is visible
      const concl = document.getElementById('conclusion');
      if (concl) {
        const conclTop = concl.getBoundingClientRect().top + window.scrollY;
        const viewportBottom = window.scrollY + window.innerHeight;
        if (conclTop <= viewportBottom - 4) {
          setActiveById('#conclusion');
          tickingSpy = false;
          return;
        }
      }

      const id = pickByMidpoints(probeY);
      setActiveById(id);
      tickingSpy = false;
    });
  }

  function boot() { applyTop(); recalcPositions(); onScrollSpy(); }
  boot();

  // --- Listeners ---
  addEventListener('scroll', () => { onScrollTop(); onScrollSpy(); }, { passive: true });
  addEventListener('resize', () => { applyTop(); recalcPositions(); onScrollSpy(); });
  addEventListener('load',   () => { applyTop(); recalcPositions(); onScrollSpy(); });
  document.addEventListener('DOMContentLoaded', () => { applyTop(); recalcPositions(); onScrollSpy(); });
  document.addEventListener('includes:loaded',  () => { applyTop(); recalcPositions(); onScrollSpy(); });

  // Recalc when images/figures actually change size (lazy-load, responsive)
  const schedule = (() => {
    let raf = null;
    return () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        recalcPositions();
        onScrollSpy();
      });
    };
  })();

  // ResizeObserver for imgs, figures, and sections
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(schedule);
    document.querySelectorAll('img, figure, section').forEach(el => ro.observe(el));
  }

  // MutationObserver for late DOM changes (e.g., fragments included)
  const mo = new MutationObserver(schedule);
  mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
})();
