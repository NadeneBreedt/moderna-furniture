function initQuoteModal() {
  function getQuoteItems() {
    return JSON.parse(localStorage.getItem('quoteItems') || '[]');
  }

  function updateQuantity(index, newQty) {
    const items = getQuoteItems();
    if (newQty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].quantity = newQty;
    }
    localStorage.setItem('quoteItems', JSON.stringify(items));
    refreshQuoteTable();
  }

  function refreshQuoteTable() {
    const items = getQuoteItems();
    const tableBody = document.querySelector('#quote-items-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    if (items.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="4" style="text-align: center; padding: 1rem;">
          Your quote is empty
        </td>
      `;
      tableBody.appendChild(emptyRow);
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td style="padding: 0.5rem;">
          <div class="product-name">${item.name || `Product #${item.id}`}</div>
        </td>
        <td style="padding: 0.5rem; color: #666;">
          ${item.variant || 'No variant selected'}
        </td>
        <td style="padding: 0.5rem; text-align: center;">
          <div class="quantity-controls">
            <button onclick="window.updateQuantity(${index}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="window.updateQuantity(${index}, ${item.quantity + 1})">+</button>
          </div>
        </td>
        <td style="padding: 0.5rem; text-align: right;">
          <button onclick="window.updateQuantity(${index}, 0)" class="remove-btn">Remove</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  }

  // Make functions globally available
  window.updateQuantity = updateQuantity;
  window.refreshQuoteTable = refreshQuoteTable;

  const floatingBtn = document.getElementById('quote-floating-btn');
  const modalOverlay = document.getElementById('quote-modal-overlay');
  const modalClose = document.getElementById('quote-modal-close');
  const quoteForm = document.getElementById('quote-form');
  const mainContent = document.getElementById('main-content');

  if (floatingBtn) {
    floatingBtn.addEventListener('click', () => {
      refreshQuoteTable();
      modalOverlay.style.display = 'flex';
      if (mainContent) {
        mainContent.style.filter = 'blur(5px)';
        mainContent.style.transition = 'filter 0.3s ease';
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalOverlay.style.display = 'none';
      if (mainContent) {
        mainContent.style.filter = 'none';
      }
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
        if (mainContent) {
          mainContent.style.filter = 'none';
        }
      }
    });
  }

  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const items = getQuoteItems();
      if (!items.length) {
        alert('Please add items to your quote first.');
        return;
      }

      const formData = {
        name: document.getElementById('quote-name').value,
        email: document.getElementById('quote-email').value,
        phone: document.getElementById('quote-phone').value,
        items: items
      };

      console.log('Quote submission:', formData);
      alert('Quote submitted successfully!');
      
      localStorage.removeItem('quoteItems');
      modalOverlay.style.display = 'none';
      if (mainContent) {
        mainContent.style.filter = 'none';
      }
      quoteForm.reset();
      refreshQuoteTable();
    });
  }
}

// Initialize the modal
initQuoteModal(); 