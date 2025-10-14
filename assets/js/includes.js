// assets/js/includes.js
function injectIncludes() {
  document.querySelectorAll('[data-include]').forEach(async (el) => {
    const src = el.getAttribute('data-include');
    // Skip header/footer placeholders or anything that's not an .html file
    if (!src || !/\.html(\?|#|$)/i.test(src)) return;

    try {
      const res = await fetch(src, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.statusText);
      el.innerHTML = await res.text();
    } catch (e) {
      console.error("Include failed:", src, e);
      // Optionally show a small warning instead of clearing
      // el.innerHTML = `<p class="text-red-600 text-sm">Failed to load ${src}</p>`;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectIncludes);
} else {
  injectIncludes();
}
