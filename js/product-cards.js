/**
 * Standardized product enquiry button functionality
 * This ensures consistent behavior for enquiry buttons across the site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find all product enquiry buttons
  const enquiryButtons = document.querySelectorAll('.enquire-single-btn');
  
  enquiryButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get product data from data attributes
      const productId = this.dataset.productId;
      const productName = this.dataset.productName;
      const variantId = this.dataset.variantId || null;
      const variantName = this.dataset.variantName || '';
      
      // Add to quote
      if (typeof window.addToQuote === 'function') {
        window.addToQuote(productId, productName, variantName, variantId);
      } else {
        // Fallback implementation
        const items = JSON.parse(localStorage.getItem('quoteItems') || '[]');
        items.push({
          id: productId,
          name: productName,
          quantity: 1,
          variant: variantName,
          variant_id: variantId
        });
        localStorage.setItem('quoteItems', JSON.stringify(items));
      }
      
      // Open the quote modal
      const modalOverlay = document.getElementById('quote-modal-overlay');
      if (modalOverlay) {
        modalOverlay.style.display = 'flex';
        if (typeof refreshQuoteTable === 'function') {
          refreshQuoteTable();
        }
      }
    });
  });
  
  // Adding data attributes to buttons dynamically if they don't have them
  document.querySelectorAll('.product-card').forEach(card => {
    const productName = card.querySelector('h3')?.textContent;
    const productId = card.querySelector('a')?.href.split('id=')[1];
    const enquireBtn = card.querySelector('.enquire-single-btn');
    
    if (enquireBtn && productId && !enquireBtn.dataset.productId) {
      enquireBtn.dataset.productId = productId;
      enquireBtn.dataset.productName = productName;
    }
  });
}); 