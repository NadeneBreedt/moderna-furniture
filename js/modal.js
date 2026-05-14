import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';
const COMPANY_EMAIL = 'hello@curvoffice.co.za';
const EMAILJS_PUBLIC_KEY = 'tweJU50C9CxCHnUN3';
const EMAILJS_SERVICE_ID = 'service_baixukr';
const EMAILJS_TEMPLATE_ID = 'template_rtt96d9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function loadEmailJs() {
  if (window.emailjs) {
    return Promise.resolve(window.emailjs);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-emailjs-sdk]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.emailjs));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.async = true;
    script.dataset.emailjsSdk = 'true';
    script.onload = () => resolve(window.emailjs);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export class QuoteModal {
  constructor() {
    this.items = [];
    this.initElements();
    this.initEventListeners();
    this.blurObserver = null;
    window.addToQuote = (product, productName, selectedVariant, variantId) => {
      if (typeof product === 'object' && product !== null) {
        this.addToQuote(product, product.variant || selectedVariant, product.variant_id || variantId);
      } else {
        this.addToQuote({ id: product, name: productName }, selectedVariant, variantId);
      }
      this.refreshQuoteTable();
    };
  }

  initElements() {
    this.floatingBtn = document.getElementById('quote-floating-btn');
    this.modalOverlay = document.getElementById('quote-modal-overlay');
    this.modalClose = document.getElementById('quote-modal-close');
    this.quoteForm = document.getElementById('quote-form');
    this.mainContent = document.getElementById('main-content');
    this.tableBody = document.querySelector('#quote-items-table tbody');
    this.viewQuoteBtn = document.getElementById('view-quote-btn');
  }

  initEventListeners() {
    this.floatingBtn?.addEventListener('click', () => this.openModal());
    this.viewQuoteBtn?.addEventListener('click', () => {
      const notification = document.getElementById('quote-notification');
      if (notification) notification.style.display = 'none';
      this.openModal();
    });
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
    try {
      const items = JSON.parse(localStorage.getItem('quoteItems') || '[]');
      return Array.isArray(items) ? items.filter(item => item && item.id) : [];
    } catch (error) {
      console.warn('Could not read quote items:', error);
      return [];
    }
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
          <td colspan="4" style="text-align: center; padding: 1rem; color: #78716c;">
            Add products to build a quote request.
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
    const variant = item.variant || item.variant_name || item.specifications || '-';
    const quantity = item.quantity || item.qty || 1;
    return `
        <td style="padding: 0.75rem 0.5rem; border-bottom: 1px solid #e7e5e4;">
            <div class="product-name">${this.escapeHtml(item.name || `Product #${item.id}`)}</div>
        </td>
        <td style="padding: 0.75rem 0.5rem; border-bottom: 1px solid #e7e5e4;">
            <div class="product-variant">${this.escapeHtml(variant)}</div>
        </td>
        <td style="text-align: center; padding: 0.75rem 0.5rem; border-bottom: 1px solid #e7e5e4;">
            <div style="display: flex; align-items: center; justify-content: center;">
                <button class="quantity-btn" type="button" onclick="window.quoteModal.updateQuantity(${index}, ${quantity - 1})" aria-label="Decrease quantity">-</button>
                <span style="margin: 0 10px; min-width: 1.5rem;">${quantity}</span>
                <button class="quantity-btn" type="button" onclick="window.quoteModal.updateQuantity(${index}, ${quantity + 1})" aria-label="Increase quantity">+</button>
            </div>
        </td>
        <td style="text-align: right; padding: 0.75rem 0.5rem; border-bottom: 1px solid #e7e5e4;">
            <button class="remove-btn" type="button" onclick="window.quoteModal.updateQuantity(${index}, 0)">Remove</button>
        </td>
    `;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  openModal() {
    this.refreshQuoteTable();
    if (!this.modalOverlay) return;
    const notification = document.getElementById('quote-notification');
    if (notification) notification.style.display = 'none';
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
    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'none';
    }
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

      const emailResult = await this.sendQuoteNotification(formData, items);
      console.log('Quote notification email sent:', emailResult);

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

  async sendQuoteNotification(formData, items) {
    try {
      const emailjs = await loadEmailJs();
      emailjs.init(EMAILJS_PUBLIC_KEY);
      const quoteItemsText = items.length
        ? items.map(item => `${item.quantity || 1} x ${item.name}${item.variant ? ` (${item.variant})` : ''}`).join('\n')
        : 'No products selected';
      const emailMessage = [
        formData.customer_comments || 'Quote request submitted from the website.',
        '',
        `Phone: ${formData.customer_phone || 'Not provided'}`,
        'Quote items:',
        quoteItemsText,
        formData.attachment_url ? `Attachment: ${formData.attachment_url}` : ''
      ].filter(Boolean).join('\n');

      const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: COMPANY_EMAIL,
        to_name: 'Admin',
        from_name: formData.customer_name,
        from_email: formData.customer_email,
        reply_to: formData.customer_email,
        name: formData.customer_name,
        email: formData.customer_email,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        subject: 'New quote request from Curv Office website',
        phone: formData.customer_phone || 'Not provided',
        customer_phone: formData.customer_phone || 'Not provided',
        message: emailMessage,
        quote_items: quoteItemsText,
        attachment_url: formData.attachment_url || ''
      });
      return result;
    } catch (error) {
      console.error('Quote notification email could not be sent:', error);
      throw error;
    }
  }

  addToQuote(product, selectedVariant, variantId) {
    const items = this.getQuoteItems();
    const productId = product.id || product.product_id;
    const productName = product.name || product.product_name || `Product #${productId}`;
    const quantityToAdd = Math.max(parseInt(product.quantity || product.qty || 1, 10), 1);
    const variantName = selectedVariant || product.variant || product.variant_name || product.specifications || '';
    const selectedVariantId = variantId || product.variant_id || product.selected_variant_id || '';
    
    const existingItem = items.find(item => {
      const sameProduct = String(item.id) === String(productId);
      const itemVariantId = item.variant_id || item.selected_variant_id || '';
      const itemVariantName = item.variant || item.variant_name || item.specifications || '';
      return sameProduct &&
        String(itemVariantId) === String(selectedVariantId) &&
        String(itemVariantName) === String(variantName);
    });

    if (existingItem) {
      existingItem.quantity = (parseInt(existingItem.quantity || existingItem.qty || 1, 10) || 1) + quantityToAdd;
    } else {
      items.push({
        id: productId,
        name: productName,
        quantity: quantityToAdd,
        variant: variantName,
        variant_id: selectedVariantId,
        option_id: product.option_id || ''
      });
    }

    localStorage.setItem('quoteItems', JSON.stringify(items));
    this.refreshQuoteTable();
    this.showQuoteNotification();
  }

  animateAddToQuote(sourceElement) {
    const quoteTag = this.floatingBtn || document.getElementById('quote-floating-btn');
    const card = sourceElement?.closest?.('.product-card');
    if (!quoteTag || !card) return;

    const cardRect = card.getBoundingClientRect();
    const tagRect = quoteTag.getBoundingClientRect();
    const flyingCard = card.cloneNode(true);

    flyingCard.classList.add('quote-fly-card');
    flyingCard.style.left = `${cardRect.left}px`;
    flyingCard.style.top = `${cardRect.top}px`;
    flyingCard.style.width = `${cardRect.width}px`;
    flyingCard.style.height = `${cardRect.height}px`;
    document.body.appendChild(flyingCard);

    const targetX = tagRect.left + tagRect.width / 2 - (cardRect.left + cardRect.width / 2);
    const targetY = tagRect.top + tagRect.height / 2 - (cardRect.top + cardRect.height / 2);

    const animation = flyingCard.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 0.95 },
      { transform: `translate(${targetX * 0.62}px, ${targetY * 0.25}px) scale(0.62)`, opacity: 0.72 },
      { transform: `translate(${targetX}px, ${targetY}px) scale(0.08)`, opacity: 0 }
    ], {
      duration: 620,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    });

    animation.onfinish = () => {
      flyingCard.remove();
      quoteTag.classList.remove('quote-bounce');
      void quoteTag.offsetWidth;
      quoteTag.classList.add('quote-bounce');
    };
  }

  showQuoteNotification() {
    const notification = document.getElementById('quote-notification');
    if (!notification) return;

    notification.style.display = 'flex';
    window.clearTimeout(this.notificationTimeout);
    this.notificationTimeout = window.setTimeout(() => {
      notification.style.display = 'none';
    }, 4000);
  }
}
