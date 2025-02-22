import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class QuoteModal {
  constructor() {
    this.items = [];
    this.initElements();
    this.initEventListeners();
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
    this.mainContent?.classList.add('blur');
    document.getElementById('my-header')?.classList.add('blur');
  }

  closeModal() {
    this.modalOverlay.style.display = 'none';
    document.body.style.overflow = '';
    this.mainContent?.classList.remove('blur');
    document.getElementById('my-header')?.classList.remove('blur');
  }

  async handleSubmit(e) {
    e.preventDefault();
    const items = this.getQuoteItems();
    if (!items.length) {
      alert('Please add items to your quote first.');
      return;
    }

    try {
      // Get form data
      const formData = {
        customer_name: document.getElementById('quote-name').value,
        customer_email: document.getElementById('quote-email').value,
        customer_phone: document.getElementById('quote-phone').value,
        status: 'new',
        created_at: new Date().toISOString()
      };

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

      // Insert quote items
      const quoteItems = items.map(item => ({
        quote_request_id: quoteData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity || item.qty,
        specifications: item.specifications || ''
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(quoteItems);

      if (itemsError) throw itemsError;

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
} 