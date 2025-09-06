// footer-loader.js
// Injects the shared footer into pages. Uses a version parameter to bust caches.
(function() {
  const FOOTER_VERSION = '2';
  const footerUrl = `footer.html?v=${FOOTER_VERSION}`;

  function injectFooter(html) {
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
      placeholder.outerHTML = html;
    } else {
      // Append at the end of body if no placeholder exists
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper.firstElementChild);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    fetch(footerUrl, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load footer');
        return res.text();
      })
      .then((html) => injectFooter(html))
      .catch((err) => console.warn('Footer load error:', err));
  });
})(); 