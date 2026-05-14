import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';
const COMPANY_EMAIL = 'hello@curvoffice.co.za';
const EMAILJS_PUBLIC_KEY = 'tweJU50C9CxCHnUN3';
const EMAILJS_SERVICE_ID = 'service_baixukr';
const EMAILJS_TEMPLATE_ID = 'template_rtt96d9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The flying-puck animation and tag-bounce live in js/quote-animation.js,
// loaded with `defer` on every page that needs them. We just delegate.
function bounceQuoteTag() {
  if (typeof window.bounceQuoteTag === 'function' && window.bounceQuoteTag !== bounceQuoteTag) {
    window.bounceQuoteTag();
    return;
  }
  const quoteTag = document.getElementById('quote-floating-btn');
  if (!quoteTag) return;
  quoteTag.classList.remove('quote-bounce');
  void quoteTag.offsetWidth;
  quoteTag.classList.add('quote-bounce');
}

function flyProductToQuote(sourceElement) {
  if (typeof window.flyProductToQuote === 'function' && window.flyProductToQuote !== flyProductToQuote) {
    window.flyProductToQuote(sourceElement);
    return;
  }
  bounceQuoteTag();
}

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
    window.animateQuoteAdd = flyProductToQuote;
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
    console.log('Quote items before submission:', items);

    const submitBtn = this.quoteForm?.querySelector('button[type="submit"]');
    const originalSubmitText = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    // Build the form payload once so both email and DB see identical data.
    const formData = {
      customer_name: document.getElementById('quote-name')?.value?.trim() || '',
      customer_email: document.getElementById('quote-email')?.value?.trim() || '',
      customer_phone: document.getElementById('quote-phone')?.value?.trim() || '',
      customer_comments: document.getElementById('quote-comments')?.value?.trim() || '',
      status: 'new',
      created_at: new Date().toISOString()
    };

    // Attachment upload is best-effort: we don't want a Supabase storage glitch
    // to swallow the customer's quote request before we email it.
    try {
      const fileInput = document.getElementById('quote-attachment');
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, file);
        if (uploadError) {
          console.warn('Attachment upload failed; continuing without it:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('quote-attachments')
            .getPublicUrl(fileName);
          formData.attachment_url = publicUrl;
        }
      }
    } catch (attachmentError) {
      console.warn('Attachment step threw; continuing without attachment:', attachmentError);
    }

    // 1) EMAIL FIRST. This is the customer-critical action: even if Supabase
    // is misconfigured, the lead reaches hello@curvoffice.co.za.
    let emailError = null;
    try {
      const result = await this.sendQuoteNotification(formData, items);
      console.log('Quote notification email sent:', result);
    } catch (err) {
      emailError = err;
      console.error('Quote notification email failed:', err);
    }

    // 2) Then try the database. Failures here are logged but never block the
    // customer's confirmation, because the email already captured the lead.
    let dbError = null;
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_requests')
        .insert([formData])
        .select()
        .single();
      if (quoteError) throw quoteError;

      if (items.length > 0 && quoteData?.id) {
        const quoteItems = items.map(item => {
          const row = {
            quote_request_id: quoteData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity || item.qty || 1,
            specifications: item.specifications || item.variant || ''
          };
          if (item.variant_id) row.selected_variant_id = item.variant_id;
          return row;
        });
        const { error: itemsError } = await supabase.from('quote_items').insert(quoteItems);
        if (itemsError) throw itemsError;
      }
    } catch (err) {
      dbError = err;
      console.error('Quote DB persistence failed:', err);
    }

    // Restore submit button before any alert so the modal isn't left in a
    // stuck "Sending…" state.
    if (submitBtn) {
      submitBtn.disabled = false;
      if (originalSubmitText) submitBtn.textContent = originalSubmitText;
    }

    if (!emailError) {
      // Customer hears one clear success message regardless of DB.
      alert('Thanks! Your quote request has been sent to Curv Office. We will be in touch shortly.');
      localStorage.removeItem('quoteItems');
      this.closeModal();
      this.quoteForm.reset();
      this.refreshQuoteTable();
      return;
    }

    // Email failed — surface a clear, actionable message rather than a
    // generic "please try again" that hides the real problem.
    const emailDetail = (emailError && (emailError.text || emailError.message)) || 'Unknown error';
    alert(
      'We could not send your quote request right now.\n\n' +
      'Please email us directly at hello@curvoffice.co.za or try again in a moment.\n\n' +
      'Details: ' + emailDetail
    );
    if (dbError) console.error('Both email and DB persistence failed.', { emailError, dbError });
  }

  async sendQuoteNotification(formData, items) {
    const emailjs = await loadEmailJs();
    emailjs.init(EMAILJS_PUBLIC_KEY);

    const quoteItemsText = items.length
      ? items.map(item => {
          const qty = item.quantity || item.qty || 1;
          const variant = item.variant ? ` (${item.variant})` : '';
          return `${qty} x ${item.name}${variant}`;
        }).join('\n')
      : 'No products selected';

    const emailMessage = [
      formData.customer_comments || 'Quote request submitted from the website.',
      '',
      `Name: ${formData.customer_name || 'Not provided'}`,
      `Email: ${formData.customer_email || 'Not provided'}`,
      `Phone: ${formData.customer_phone || 'Not provided'}`,
      '',
      'Quote items:',
      quoteItemsText,
      formData.attachment_url ? `\nAttachment: ${formData.attachment_url}` : ''
    ].filter(Boolean).join('\n');

    // Payload uses every common EmailJS template variable name so the existing
    // template will pick up the fields it references — `to_email`, `reply_to`,
    // `from_name`, `message`, `quote_items` are the ones that matter for the
    // current `template_rtt96d9` template.
    const payload = {
      to_email: COMPANY_EMAIL,
      to_name: 'Curv Office',
      from_name: formData.customer_name || 'Website visitor',
      from_email: formData.customer_email || COMPANY_EMAIL,
      reply_to: formData.customer_email || COMPANY_EMAIL,
      name: formData.customer_name || 'Website visitor',
      email: formData.customer_email || '',
      customer_name: formData.customer_name || '',
      customer_email: formData.customer_email || '',
      subject: 'New quote request from Curv Office website',
      phone: formData.customer_phone || 'Not provided',
      customer_phone: formData.customer_phone || 'Not provided',
      message: emailMessage,
      quote_items: quoteItemsText,
      attachment_url: formData.attachment_url || ''
    };

    console.log('Sending quote email with payload:', payload);
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
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
    if (!window.quoteAddAnimationRunning) {
      this.bounceQuoteTag();
    }
  }

  animateAddToQuote(sourceElement) {
    flyProductToQuote(sourceElement);
  }

  bounceQuoteTag() {
    bounceQuoteTag();
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
