import React from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Toaster } from 'sonner'
import ProductCategoryGrid from './components/ProductCategoryGrid'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data: products } = await supabase
    .from('products')
    .select('product_id, product_name, product_image, category_id')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Product Management</h1>
      <Toaster position="top-right" />
      <ProductCategoryGrid products={products || []} categories={categories || []} />
    </div>
  )
} 