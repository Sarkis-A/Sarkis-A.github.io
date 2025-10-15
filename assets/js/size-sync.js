// assets/js/size-sync.js
(() => {
  // simple debounce
  const debounce = (fn, ms = 150) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // set all elements’ heights to the tallest within a scope
  function equalize(selector, scope = document) {
    const els = Array.from(scope.querySelectorAll(selector));
    if (!els.length) return;
    // reset to natural height first
    els.forEach(el => (el.style.height = ''));
    // compute tallest
    const max = Math.max(...els.map(el => el.offsetHeight || 0));
    if (!isFinite(max) || max === 0) return;
    // apply
    els.forEach(el => (el.style.height = `${max}px`));
  }

  function runAll() {
    // Artifacts: only within the artifacts section
    const artifacts = document.getElementById('artifacts');
    if (artifacts) equalize('.card-eq', artifacts);

    // Enhancements: equalize across visible DOM cards (all slides are in DOM)
    const enhancements = document.getElementById('enhancements');
    if (enhancements) equalize('.card-eq', enhancements);
  }

  // re-run on load / includes / resize (debounced)
  const runAllDebounced = debounce(runAll, 100);

  document.addEventListener('DOMContentLoaded', runAll);
  document.addEventListener('includes:loaded', runAll);
  window.addEventListener('resize', runAllDebounced);

  // If you re-init Swiper dynamically on this page, call runAll() after init.
})();
