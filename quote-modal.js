import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const items = getQuoteItems();
      if (!items.length) {
        alert('Please add items to your quote first.');
        return;
      }

      // Debug: Log the items to see their structure
      console.log('Items before processing:', items);

      try {
        // Handle file upload if there's an attachment
        let attachmentUrl = null;
        const fileInput = document.getElementById('quote-attachment');
        
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `quote-attachments/${fileName}`;
          
          // Upload the file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
            
          attachmentUrl = urlData.publicUrl;
        }

        // Create the quote request with attachment URL if available
        const { data: quoteRequest, error: quoteError } = await supabase
          .from('quote_requests')
          .insert({
            customer_name: document.getElementById('quote-name').value,
            customer_email: document.getElementById('quote-email').value,
            customer_phone: document.getElementById('quote-phone').value,
            status: 'new',
            attachment_url: attachmentUrl
          })
          .select()
          .single();

        if (quoteError) throw quoteError;
        
        console.log('Quote items from localStorage:', items);
        
        // Create the quote items with variant information
        const quoteItems = [];

        for (const item of items) {
          // Log each item to see its structure
          console.log('Processing item:', item);
          
          // Create the basic quote item
          const quoteItem = {
            quote_request_id: quoteRequest.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity || 1,
            specifications: item.specifications || item.variant || ''
          };
          
          // Explicitly check for variant_id
          console.log('Item variant_id:', item.variant_id);
          
          // Add the selected_variant_id if it exists
          if (item.variant_id) {
            quoteItem.selected_variant_id = item.variant_id;
            console.log('Added variant_id to quote item:', item.variant_id);
          }
          
          console.log('Final quote item:', quoteItem);
          quoteItems.push(quoteItem);
        }

        console.log('Quote items to be inserted:', quoteItems);

        // Check if the quote_items table has the selected_variant_id column
        const { data: tableInfo, error: tableError } = await supabase
          .from('quote_items')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Error checking table structure:', tableError);
        } else {
          console.log('Table structure check:', tableInfo);
        }

        const { data: insertedItems, error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)
          .select();

        if (itemsError) {
          console.error('Error inserting quote items:', itemsError);
          throw itemsError;
        }
        
        console.log('Inserted quote items:', insertedItems);

        alert('Quote submitted successfully!');
        
        localStorage.removeItem('quoteItems');
        modalOverlay.style.display = 'none';
        quoteForm.reset();
        refreshQuoteTable();
      } catch (error) {
        console.error('Error submitting quote:', error);
        alert('Error submitting quote: ' + error.message);
      }
    });
  }
}

// Initialize the modal
initQuoteModal(); 

// Function to add an item to the quote with variant information
window.addToQuote = function(productId, productName, variantName, variantId) {
  console.log('Adding to quote:', { 
    productId, 
    productName, 
    variantName, 
    variantId 
  });
  
  const items = JSON.parse(localStorage.getItem('quoteItems') || '[]');
  
  // Check if this product is already in the cart with this variant
  const existingItemIndex = items.findIndex(item => 
    item.id === productId && 
    (item.variant_id === variantId || (!item.variant_id && !variantId))
  );
  
  if (existingItemIndex >= 0) {
    // If already in cart, increase quantity
    items[existingItemIndex].quantity = (items[existingItemIndex].quantity || 1) + 1;
    console.log('Increased quantity for existing item');
  } else {
    // Add new item to cart
    const newItem = {
      id: productId,
      name: productName,
      quantity: 1,
      variant: variantName,   // Store the variant name/description
      variant_id: variantId   // Store the variant ID for database reference
    };
    
    items.push(newItem);
    console.log('Added new item to quote:', newItem);
  }
  
  // Save updated cart to localStorage
  localStorage.setItem('quoteItems', JSON.stringify(items));
  
  // Log the current state of the quote items
  console.log('Current quote items:', items);
  
  // Optional: Show confirmation to user
  alert('Item added to your quote!');
}; 