/**
 * Header loader for Curv Office.
 *
 * Fetches header.html, injects it into #my-header, and pins the navigation
 * header to the top of the viewport. Layout/positioning is handled by CSS;
 * this file only owns:
 *   - fetching the header markup
 *   - ensuring the nav header is sticky (in case CSS doesn't load in time)
 *   - registering the service worker
 *
 * IMPORTANT: every selector MUST be scoped to the navigation header
 * (`#my-header header` / `.header`). Earlier versions used a bare
 * `document.querySelector('header')`, which on pages like products.html
 * (where the page title is also a <header> element) would race the fetch
 * and pin the wrong element to the viewport — covering the menu.
 */

const HEADER_VERSION = '6';
const HEADER_URL = `header.html?v=${HEADER_VERSION}`;

function getNavHeader() {
  // The actual <header class="header"> lives inside #my-header after fetch.
  return document.querySelector('#my-header > header') || document.querySelector('#my-header header.header');
}

function applyStickyNav() {
  const container = document.getElementById('my-header');
  if (container) {
    container.style.position = 'sticky';
    container.style.top = '0';
    container.style.zIndex = '9999';
    container.style.width = '100%';
  }
  const nav = getNavHeader();
  if (nav) {
    nav.style.position = 'sticky';
    nav.style.top = '0';
    nav.style.zIndex = '9999';
    nav.style.backgroundColor = nav.style.backgroundColor || 'white';
  }
}

function removePhoneFromHeader(root) {
  if (!root) return;
  root.querySelectorAll('a[href^="tel:"], a[href*="tel:"]').forEach((a) => a.remove());
  root.querySelectorAll('a').forEach((a) => {
    const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.includes('064') && t.includes('7341')) a.remove();
  });
  const navHeader = root.querySelector('#my-header header') || root.querySelector('header.header');
  if (navHeader) {
    const bar = navHeader.querySelector('.info-bar') || navHeader.firstElementChild;
    const inner = bar && bar.querySelector && bar.querySelector('div');
    if (inner && inner.style) inner.style.justifyContent = 'center';
  }
}

async function loadHeader(retries = 3) {
  const headerContainer = document.getElementById('my-header');
  if (!headerContainer) return;

  // Apply sticky once up front so the placeholder reserves space immediately.
  applyStickyNav();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(HEADER_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Header fetch failed: ${res.status}`);
      headerContainer.innerHTML = await res.text();
      removePhoneFromHeader(headerContainer);
      applyStickyNav();
      console.log('Header loaded successfully');
      return;
    } catch (err) {
      console.error(`Error loading header (attempt ${attempt}):`, err);
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500));
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader();

  // Register the service worker for offline / cache control.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }

  // Quicklink prefetches same-origin links the user is likely to visit next.
  const ql = document.createElement('script');
  ql.src = 'https://unpkg.com/quicklink@2.3.0/dist/quicklink.umd.js';
  ql.async = true;
  ql.onload = () => {
    try {
      window.quicklink && window.quicklink.listen({
        origins: true,
        ignores: [/^mailto:/, /^tel:/, /\.pdf$/i],
        timeout: 2000
      });
    } catch (e) {
      console.warn('Quicklink init failed:', e);
    }
  };
  document.head.appendChild(ql);
});

// Export for any callers that depended on the old API.
window.loadHeader = loadHeader;
