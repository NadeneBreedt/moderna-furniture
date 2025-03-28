'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Category, Product } from '@/types'
import { toast } from 'sonner'

interface ProductCategoryGridProps {
  products: Product[]
  categories: Category[]
}

export default function ProductCategoryGrid({ products, categories }: ProductCategoryGridProps) {
  const supabase = createClientComponentClient()
  const [editingProduct, setEditingProduct] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const handleCategoryChange = async (productId: number, categoryId: number) => {
    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ category_id: categoryId })
        .eq('product_id', productId)

      if (error) throw error

      toast.success('Product category updated successfully')
      setEditingProduct(null)
      // Refresh the page to show updated categories
      window.location.reload()
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update product category')
    }
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      toast.success('Product deleted successfully')
      // Refresh the page to show updated product list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-48">
            <Image
              src={product.product_image || '/placeholder.png'}
              alt={product.product_name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold mb-2">{product.product_name}</h3>
            
            {editingProduct === product.product_id ? (
              <div className="space-y-2">
                <select
                  className="w-full p-2 border rounded"
                  value={selectedCategory || product.category_id || ''}
                  onChange={(e) => setSelectedCategory(Number(e.target.value))}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                      if (selectedCategory) {
                        handleCategoryChange(product.product_id, selectedCategory)
                      }
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    onClick={() => setEditingProduct(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => {
                    setEditingProduct(product.product_id)
                    setSelectedCategory(product.category_id)
                  }}
                >
                  Edit Category
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => handleDelete(product.product_id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 