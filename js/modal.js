import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class QuoteModal {
  constructor() {
    this.items = [];
    this.initElements();
    this.initEventListeners();
    this.blurObserver = null;
  }

  initElements() {
    this.floatingBtn = document.getElementById('quote-floating-btn');
    this.modalOverlay = document.getElementById('quote-modal-overlay');
    this.modalClose = document.getElementById('quote-modal-close');
    this.quoteForm = document.getElementById('quote-form');
    this.mainContent = document.getElementById('main-content');
    this.tableBody = document.querySelector('#quote-items-table tbody');
  }

  initEventListeners() {
    this.floatingBtn?.addEventListener('click', () => this.openModal());
    this.modalClose?.addEventListener('click', () => this.closeModal());
    this.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });
    this.quoteForm?.addEventListener('submit', (e) => this.handleSubmit(e));

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('spec-input')) {
        const index = parseInt(e.target.dataset.index);
        this.updateSpecifications(index, e.target.value);
      }
    });

    const submitBtn = document.querySelector('#quote-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        // Remove any validation that checks if items exist
        // Allow form submission regardless of whether items are in the quote
      });
    }
  }

  getQuoteItems() {
    return JSON.parse(localStorage.getItem('quoteItems') || '[]');
  }

  updateQuantity(index, newQty) {
    const items = this.getQuoteItems();
    if (newQty <= 0) {
      items.splice(index, 1);
    } else {
      items[index].quantity = newQty;
    }
    localStorage.setItem('quoteItems', JSON.stringify(items));
    this.refreshQuoteTable();
  }

  updateSpecifications(index, specs) {
    const items = this.getQuoteItems();
    items[index].specifications = specs;
    localStorage.setItem('quoteItems', JSON.stringify(items));
  }

  refreshQuoteTable() {
    const items = this.getQuoteItems();
    console.log('Quote items:', items);
    if (!this.tableBody) return;

    this.tableBody.innerHTML = '';
    
    if (items.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 1rem;">
            Your quote is empty
          </td>
        </tr>
      `;
      return;
    }

    items.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = this.createRowHTML(item, index);
      this.tableBody.appendChild(row);
    });
  }

  createRowHTML(item, index) {
    console.log('Creating row for item:', item);
    return `
        <td>
            <div class="product-name">${item.name || `Product #${item.id}`}</div>
            ${item.variant ? `<div class="product-variant">Variant: ${item.variant}</div>` : ''}
        </td>
        <td style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center;">
                <button class="quantity-btn" onclick="window.quoteModal.updateQuantity(${index}, ${(item.quantity || 1) - 1})">-</button>
                <span style="margin: 0 10px;">${item.quantity || 1}</span>
                <button class="quantity-btn" onclick="window.quoteModal.updateQuantity(${index}, ${(item.quantity || 1) + 1})">+</button>
            </div>
        </td>
        <td style="text-align: right;">
            <button class="remove-btn" onclick="window.quoteModal.updateQuantity(${index}, 0)">Remove</button>
        </td>
    `;
  }

  openModal() {
    this.refreshQuoteTable();
    this.modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Clear any previous intervals to prevent multiple instances
    if (this.blurInterval) {
      clearInterval(this.blurInterval);
      this.blurInterval = null;
    }
    
    // Apply simple visibility modifications instead of complex filters
    const mainContent = document.getElementById('main-content');
    const header = document.getElementById('my-header');
    
    if (mainContent) {
      mainContent.classList.add('blur');
      mainContent.style.opacity = '0.8'; // Use opacity instead of filter
    }
    
    if (header) {
      header.classList.add('blur');
      header.style.opacity = '0.8'; // Use opacity instead of filter
    }
    
    // Make sure modal is fully visible
    const modal = document.getElementById('quote-modal');
    if (modal) {
      modal.style.opacity = '1';
    }
    
    // Safety timeout to ensure the page doesn't remain blank
    this.safetyTimeout = setTimeout(() => {
      // If something goes wrong, make sure everything is visible
      const allContent = document.querySelectorAll('*');
      allContent.forEach(element => {
        if (element !== this.modalOverlay && !this.modalOverlay.contains(element)) {
          element.style.opacity = '1';
          element.style.filter = 'none';
        }
      });
    }, 5000); // After 5 seconds
  }

  setupBlurObserver(mainContent, header) {
    // We'll skip the mutation observer approach as it might be causing issues
  }

  closeModal() {
    this.modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
    
    const mainContent = document.getElementById('main-content');
    const header = document.getElementById('my-header');
    
    if (mainContent) {
      mainContent.classList.remove('blur');
      mainContent.style.opacity = '1';
      mainContent.style.filter = '';
    }
    
    if (header) {
      header.classList.remove('blur');
      header.style.opacity = '1';
      header.style.filter = '';
    }
    
    // Disconnect the observer when modal is closed
    if (this.blurObserver) {
      this.blurObserver.disconnect();
      this.blurObserver = null;
    }
    
    // Clear the interval when the modal is closed
    if (this.blurInterval) {
      clearInterval(this.blurInterval);
      this.blurInterval = null;
    }
    
    // Clear safety timeout
    if (this.safetyTimeout) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    
    // Ensure everything is visible
    const allContent = document.querySelectorAll('*');
    allContent.forEach(element => {
      element.style.opacity = '';
      element.style.filter = '';
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    const items = this.getQuoteItems();
    // Remove the validation check that was blocking submission
    // if (!items.length) {
    //   alert('Please add items to your quote first.');
    //   return;
    // }

    console.log('Quote items before submission:', items);

    try {
      // Get form data
      const formData = {
        customer_name: document.getElementById('quote-name').value,
        customer_email: document.getElementById('quote-email').value,
        customer_phone: document.getElementById('quote-phone').value,
        status: 'new',
        created_at: new Date().toISOString()
      };

      // Add comments if present
      const comments = document.getElementById('quote-comments');
      if (comments && comments.value) {
        formData.customer_comments = comments.value;
      }

      // Handle file upload if present
      const fileInput = document.getElementById('quote-attachment');
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = `${Date.now()}-${file.name}`;
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(fileName);

        formData.attachment_url = publicUrl;
      }

      // Insert quote request
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_requests')
        .insert([formData])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Only insert quote items if there are any
      if (items.length > 0) {
        // Insert quote items with variant_id
        const quoteItems = items.map(item => {
          // Create the basic quote item
          const quoteItem = {
            quote_request_id: quoteData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity || item.qty || 1,
            specifications: item.specifications || item.variant || ''
          };
          
          // Add the selected_variant_id if it exists
          if (item.variant_id) {
            quoteItem.selected_variant_id = item.variant_id;
          }
          
          return quoteItem;
        });

        console.log('Quote items to be inserted:', quoteItems);

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);

        if (itemsError) throw itemsError;
      }

      // Success! Clear form and close modal
      alert('Quote submitted successfully!');
      localStorage.removeItem('quoteItems');
      this.closeModal();
      this.quoteForm.reset();
      this.refreshQuoteTable();

    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote. Please try again.');
    }
  }

  addToQuote(product, selectedVariant, variantId) {
    const items = JSON.parse(localStorage.getItem('quoteItems') || '[]');
    
    // Create the quote item with variant information
    const quoteItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        variant: selectedVariant,  // The variant value/name
        variant_id: variantId,    // Store the variant ID
        option_id: product.option_id // Store the option ID if available
    };
    
    items.push(quoteItem);
    localStorage.setItem('quoteItems', JSON.stringify(items));
  }
} 