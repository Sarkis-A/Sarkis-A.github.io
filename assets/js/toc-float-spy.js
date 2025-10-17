// /assets/js/toc-float-spy.js
(() => {
  // ===== Config (tweak if your header height changes) =====
  const STICKY_OFFSET = 80;     // pixels from top (match sticky header height)
  const PROBE_FRACTION = 0.30;  // 30% down the viewport for section detection
  const BOTTOM_BUFFER = 24;     // px from bottom to force "Conclusion"

  // Find ToC and Overview
  const nav = document.getElementById('toc-nav');
  const overview = document.getElementById('overview');
  if (!nav || !overview) return;

  // ===== Floating position: start beside Overview; clamp under header =====
  let tickingTop = false;

  function computeTop() {
    const overviewY = overview.getBoundingClientRect().top + window.scrollY;
    return Math.max(STICKY_OFFSET, overviewY - window.scrollY);
  }
  function applyTop() { nav.style.top = computeTop() + 'px'; tickingTop = false; }
  function onScrollTop() {
    if (!tickingTop) { requestAnimationFrame(applyTop); tickingTop = true; }
  }

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nav.style.transition = 'top .18s ease-out';
  }

  // ===== Active section highlight (midpoint-boundary method) =====
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const ids = links.map(a => a.getAttribute('href')).filter(Boolean);
  const sections = ids.map(id => document.querySelector(id)).filter(Boolean);
  const linkById = Object.fromEntries(links.map(a => [a.getAttribute('href'), a]));

  function clearActive() { links.forEach(l => l.classList.remove('text-gray-900', 'font-semibold')); }
  function setActiveById(id) {
    const link = linkById[id];
    if (!link) return;
    clearActive();
    link.classList.add('text-gray-900', 'font-semibold');
    lastActiveId = id;
  }

  // Build stable boundaries at midpoints between section tops
  let positions = [];   // [{ id, top }]
  let borders = [];     // midpoints
  let lastActiveId = null;

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

  function isNearBottom() {
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    return (docHeight - scrollBottom) <= BOTTOM_BUFFER;
  }

  function activeFromProbe(probeY) {
    if (!positions.length) return null;
    if (borders.length === 0 || probeY < borders[0]) return positions[0].id;
    if (probeY >= borders[borders.length - 1]) return positions[positions.length - 1].id;
    const idx = borders.findIndex(b => probeY < b);
    return positions[idx].id;
  }

  let tickingSpy = false;
  function onScrollSpy() {
    if (tickingSpy) return;
    tickingSpy = true;
    requestAnimationFrame(() => {
      if (isNearBottom() && document.getElementById('conclusion')) {
        setActiveById('#conclusion');
        tickingSpy = false;
        return;
      }
      const probeY = window.scrollY + STICKY_OFFSET + window.innerHeight * PROBE_FRACTION;
      const id = activeFromProbe(probeY);
      if (id) setActiveById(id);
      tickingSpy = false;
    });
  }

  // ===== Bootstrap & listeners =====
  function boot() { applyTop(); recalcPositions(); onScrollSpy(); }

  // Initial
  boot();

  // Scroll/resize/load
  addEventListener('scroll', () => { onScrollTop(); onScrollSpy(); }, { passive: true });
  addEventListener('resize', () => { applyTop(); recalcPositions(); onScrollSpy(); });
  addEventListener('load', () => { applyTop(); recalcPositions(); onScrollSpy(); });

  // If content shifts after includes or DOM ready
  document.addEventListener('DOMContentLoaded', () => { applyTop(); recalcPositions(); onScrollSpy(); });
  document.addEventListener('includes:loaded', () => { applyTop(); recalcPositions(); onScrollSpy(); });

  // Recalc after late-loading images shift layout
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => { recalcPositions(); onScrollSpy(); }, { once: true });
  });
})();
