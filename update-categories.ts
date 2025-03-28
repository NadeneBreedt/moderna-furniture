import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rpncvcioutyrxntqvlnd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTI5ODE3MiwiZXhwIjoyMDU0ODc0MTcyfQ.7Lk25rLcb5V-PItj8pp3YORvLC7OcgREkUUW2CyLctw'

const supabase = createClient(supabaseUrl, supabaseKey)

const categoryUpdates = [
  // Steel Furniture Updates
  {
    productIds: [126, 382, 383, 386, 387, 351, 390, 127, 128, 129],
    categoryId: 411,
    description: 'Moving steel lockers and storage to Steel Furniture category'
  },
  // Storage Updates
  {
    productIds: [316, 317, 318, 319, 320, 321],
    categoryId: 8,
    description: 'Moving storage items to Storage category'
  },
  // Coffee Tables Updates - Moving from Desking to Coffee Tables
  {
    productIds: [252, 253, 254, 255, 256, 257, 258, 260, 261, 262, 284, 443, 444, 445, 467],
    categoryId: 407,
    description: 'Moving coffee tables to Coffee Tables category'
  },
  // Wall Units Updates
  {
    productIds: [263, 264, 265, 266, 267, 268, 269, 270],
    categoryId: 408,
    description: 'Moving display units to Wall Units category'
  },
  // Server Units to Storage
  {
    productIds: [271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 204],
    categoryId: 8,
    description: 'Moving server units to Storage category'
  },
  // Executive Desk Updates
  {
    productIds: [193, 220, 224, 227, 228],
    categoryId: 16,
    description: 'Moving executive desks to Executive Desk category'
  },
  // Reception Counter Updates
  {
    productIds: [482],
    categoryId: 17,
    description: 'Moving reception units to Reception Counters category'
  },
  // Additional Storage Items
  {
    productIds: [185, 223, 225, 229], // Various server units currently in Desking
    categoryId: 8,
    description: 'Moving additional server units to Storage category'
  }
]

async function updateCategories() {
  try {
    // First, update the category name from 'Boardoom' to 'Boardroom'
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .update({ name: 'Boardroom' })
      .eq('name', 'Boardoom')

    if (categoryError) {
      console.error('Error fixing Boardroom spelling:', categoryError)
    } else {
      console.log('Successfully fixed Boardroom spelling')
    }

    // Update product categories
    for (const update of categoryUpdates) {
      console.log(`Processing: ${update.description}`)
      
      // Update product_categories table
      const { data, error } = await supabase
        .from('product_categories')
        .update({ category_id: update.categoryId })
        .in('product_id', update.productIds)

      if (error) {
        console.error(`Error updating ${update.description}:`, error)
      } else {
        console.log(`Successfully updated ${update.description}`)
      }
    }

  } catch (error) {
    console.error('Error in updateCategories:', error)
  }
}

updateCategories() 