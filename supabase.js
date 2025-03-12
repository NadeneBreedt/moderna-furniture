// supabase.js - Shared Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';

// Create a single client instance with a specific storage key
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'moderna-supabase-auth'
  }
});

// Fallback categories when database connection fails
export const fallbackCategories = [
  {id: 1, name: 'Office Desks'},
  {id: 2, name: 'Office Chairs'},
  {id: 3, name: 'Filing Cabinets'},
  {id: 4, name: 'Bookcases'},
  {id: 5, name: 'Office Tables'},
  {id: 6, name: 'Reception Furniture'},
  {id: 7, name: 'Office Storage'},
  {id: 8, name: 'Executive Furniture'},
  {id: 9, name: 'Meeting Room Furniture'},
  {id: 10, name: 'Boardroom Furniture'}
];

// Helper function to fetch categories from the database
export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return fallbackCategories;
    }
    
    if (!data || data.length === 0) {
      console.warn('No categories found in database, using fallback');
      return fallbackCategories;
    }
    
    console.log('Categories fetched successfully:', data.length);
    return data;
  } catch (err) {
    console.error('Exception fetching categories:', err);
    return fallbackCategories;
  }
} 