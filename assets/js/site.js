// assets/js/site.js
const Header = `
<header class="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40 border-b">
  <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
    <a href="/" class="font-extrabold tracking-tight">Austin Sarkis</a>
    <ul class="flex items-center gap-5 text-sm">
      <li><a href="/enhancements/enhancement1.html" class="hover:underline">Enhancements</a></li>
      <li><a href="/about.html" class="hover:underline">About</a></li>
      <li><a href="/contact.html" class="hover:underline">Contact</a></li>
      <li><a href="https://github.com/USERNAME" target="_blank" rel="noopener" class="text-gray-600 hover:text-gray-900" aria-label="GitHub">GitHub</a></li>
    </ul>
  </nav>
</header>`;

const Footer = `
<footer class="mt-16 border-t">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm text-gray-600">
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <p>© ${new Date().getFullYear()} Austin Sarkis. All rights reserved.</p>
      <p><a href="/contact.html" class="hover:underline">Get in touch</a></p>
    </div>
  </div>
</footer>`;

function mountChrome() {
    const header = document.querySelector('[data-include="header"]');
    const footer = document.querySelector('[data-include="footer"]');
    if (header) header.innerHTML = Header;
    if (footer) footer.innerHTML = Footer;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountChrome);
} else {
    mountChrome();
}