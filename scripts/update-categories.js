import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rpncvcioutyrxntqvlnd.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const categoryUpdates = [
  // Fix Boardroom spelling
  {
    condition: {
      category_name: 'Boardoom'
    },
    update: {
      category_name: 'Boardroom'
    }
  },
  // Move Steel Furniture items
  {
    condition: {
      product_id: [126, 382, 383, 386, 387, 351, 390, 127, 128, 129],
      category_id: 7 // Currently in Desking
    },
    update: {
      category_id: 411,
      category_name: 'Steel Furniture'
    }
  },
  // Move Storage items
  {
    condition: {
      product_id: [316, 317, 318, 319, 320, 321],
      category_id: 7 // Currently in Desking
    },
    update: {
      category_id: 8,
      category_name: 'Storage'
    }
  }
]

async function updateCategories() {
  try {
    for (const update of categoryUpdates) {
      const { condition, update: updateData } = update
      
      const { data, error } = await supabase
        .from('products_with_categories')
        .update(updateData)
        .match(condition)

      if (error) {
        console.error('Error updating categories:', error)
        continue
      }

      console.log(`Updated categories for condition:`, condition)
      console.log(`Updated data:`, data)
    }

    console.log('Category updates completed')
  } catch (error) {
    console.error('Error in updateCategories:', error)
  }
}

updateCategories() 