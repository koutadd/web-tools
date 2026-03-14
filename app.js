// Web Tools - Global JS
// Minimal utilities shared across the platform

document.addEventListener('DOMContentLoaded', () => {
  // Highlight active nav link (future use)
  const currentPath = window.location.pathname;
  document.querySelectorAll('a[href]').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
});
