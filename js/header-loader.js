/**
 * Standardized header loader for Moderna Furniture website
 * This script ensures a consistent header experience across all pages
 */

// Load the header with a retry mechanism
async function loadHeader(retries = 3) {
  let attempts = 0;
  const headerContainer = document.getElementById('my-header');
  
  // Apply initial styling to header container
  if (headerContainer) {
    headerContainer.style.position = 'sticky';
    headerContainer.style.top = '0';
    headerContainer.style.zIndex = '9999';
    headerContainer.style.minHeight = '60px';
    headerContainer.style.width = '100%';
  }
  
  // Header asset version for cache-busting when we change header.html
  const HEADER_VERSION = '3';
  const headerUrl = `header.html?v=${HEADER_VERSION}`;

  function removePhoneFromHeader(root) {
    if (!root) return;
    // Remove any click-to-call links
    root.querySelectorAll('a[href^="tel:"], a[href*="tel:"]').forEach((a) => a.remove());
    // Remove any remaining anchors that still contain the phone number text
    root.querySelectorAll('a').forEach((a) => {
      const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.includes('064') && t.includes('7341')) a.remove();
    });

    // If the contact bar was built as "space-between", re-center remaining item(s)
    const headerEl = root.querySelector('header') || document.querySelector('header');
    if (headerEl) {
      const maybeBar = headerEl.querySelector('.info-bar') || headerEl.firstElementChild;
      const inner = maybeBar && maybeBar.querySelector && maybeBar.querySelector('div');
      if (inner && inner.style) {
        inner.style.justifyContent = 'center';
      }
    }
  }
  
  // Try to load the header multiple times in case of network issues
  while (attempts < retries) {
    try {
      attempts++;
      console.log(`Loading header attempt ${attempts}...`);
      
      // Always fetch fresh header (avoid stale cached headers)
      const headerResponse = await fetch(headerUrl, { 
        cache: 'no-store',
        method: 'GET'
      });
      
      if (!headerResponse.ok) {
        throw new Error(`Header fetch failed with status: ${headerResponse.status}`);
      }
      
      const headerData = await headerResponse.text();
      
      // Replace the fallback header with the actual header
      if (headerContainer) {
        headerContainer.innerHTML = headerData;
        // Defensive: if a stale cached header included a phone link, remove it
        removePhoneFromHeader(headerContainer);
      }
      
      // Make the header visible and apply consistent styling
      const headerElement = document.querySelector('header');
      if (headerElement) {
        headerElement.style.display = 'block';
        headerElement.style.visibility = 'visible';
        headerElement.style.opacity = '1';
        headerElement.style.position = 'sticky';
        headerElement.style.top = '0';
        headerElement.style.zIndex = '9999';
      }
      
      // Apply additional styling for consistent appearance
      adjustHeaderStyling();

      // Defensive: run again after styling
      removePhoneFromHeader(document);
      
      // Ensure main content is visible
      ensureMainContentVisible();
      
      console.log('Header loaded successfully');
      break; // Success, exit the loop
      
    } catch (err) {
      console.error(`Error loading header (attempt ${attempts}):`, err);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Apply consistent styling to header elements
function adjustHeaderStyling() {
  try {
    // Target header elements
    const header = document.querySelector('header');
    const logo = document.querySelector('.logo');
    const navMenu = document.querySelector('.nav-menu');
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    
    if (header) {
      header.style.padding = '0';
      header.style.width = '100%';
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.zIndex = '9999';
      header.style.backgroundColor = 'white';
      
      // Find the container within the header
      const headerContainer = header.querySelector('.container');
      if (headerContainer) {
        headerContainer.style.padding = '0';
        headerContainer.style.width = '100%';
        headerContainer.style.maxWidth = '100%';
        headerContainer.style.display = 'flex';
        headerContainer.style.justifyContent = 'space-between';
      }
    }
    
    if (logo) {
      logo.style.marginLeft = '0';
      logo.style.paddingLeft = '20px';
    }
    
    if (navMenu) {
      navMenu.style.marginRight = '0';
      navMenu.style.paddingRight = '0';
      navMenu.style.position = 'relative';
      navMenu.style.right = '0';
    }
    
    if (nav) {
      nav.style.width = '100%';
      nav.style.display = 'flex';
      nav.style.justifyContent = 'flex-end';
    }
    
    if (navLinks) {
      navLinks.style.marginRight = '0';
      navLinks.style.paddingRight = '0';
      navLinks.style.display = 'flex';
      navLinks.style.justifyContent = 'flex-end';
    }
    
    // Target all navigation items to ensure they're properly aligned
    const navItems = document.querySelectorAll('header nav ul li');
    navItems.forEach(item => {
      item.style.marginRight = '0';
      item.style.paddingRight = '0';
    });
    
    // Ensure menu items are properly styled
    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(item => {
      item.style.marginLeft = '20px';
    });
    
    // Ensure menu is aligned to the right
    const menu = document.querySelector('.menu');
    if (menu) {
      menu.style.position = 'absolute';
      menu.style.right = '20px';
      menu.style.justifyContent = 'flex-end';
    }
  } catch (err) {
    console.error('Error in adjustHeaderStyling:', err);
  }
}

// Function to ensure main content is visible
function ensureMainContentVisible() {
  try {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'flex';
      mainContent.style.visibility = 'visible';
      mainContent.style.opacity = '1';
      
      // Make sure all elements with scroll-fade-in class are visible
      const fadeElements = document.querySelectorAll('.scroll-fade-in');
      fadeElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  } catch (err) {
    console.error('Error ensuring main content visibility:', err);
  }
}

// Initialize the header when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadHeader();
  
  // Re-apply styling after a delay to handle any race conditions
  setTimeout(adjustHeaderStyling, 200);
  
  // Ensure main content is visible after a short delay
  setTimeout(ensureMainContentVisible, 300);
  
  // Register a lightweight service worker to cache common assets
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
  
  // Load Quicklink for link prefetching to speed up page-to-page navigation
  (function loadQuicklink() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/quicklink@2.3.0/dist/quicklink.umd.js';
    script.async = true;
    script.onload = function() {
      try {
        // Prefetch visible and near-viewport same-origin links
        window.quicklink && window.quicklink.listen({
          origins: true,
          ignores: [/^mailto:/, /^tel:/, /\.pdf$/i],
          timeout: 2000
        });
      } catch (e) {
        console.warn('Quicklink init failed:', e);
      }
    };
    document.head.appendChild(script);
  })();
});

// Export functions for use in other scripts
window.loadHeader = loadHeader;
window.adjustHeaderStyling = adjustHeaderStyling;
window.ensureMainContentVisible = ensureMainContentVisible; 