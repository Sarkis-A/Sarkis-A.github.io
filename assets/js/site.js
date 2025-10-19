const Header = `
<header class="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40 border-b">
  <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
    <a href="/" class="font-extrabold tracking-tight">Austin Sarkis • ePortfolio</a>
    <ul class="flex items-center gap-5 text-sm">
      <li><a href="/enhancements/enhancement1.html" class="hover:underline">Enhancements</a></li>
      <li><a href="/about.html" class="hover:underline">About</a></li>
      <li><a href="/contact.html" class="hover:underline">Contact</a></li>
      <li><a href="https://github.com/Sarkis-A" class="hover:underline">GitHub</a></li>
      <li><a href="https://linkedin.com/in/austin-sarkis" class="hover:underline">LinkedIn</a></li>
    </ul>
  </nav>
</header>`;

const Footer = `
<footer class="mt-16 border-t">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm text-gray-600">
    <div class="flex flex-col sm:flex-row justify-between gap-4">
      <p>© 2025 Austin Sarkis. All rights reserved.</p>
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