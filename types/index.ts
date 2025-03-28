export interface Product {
  product_id: number
  product_name: string
  product_image: string | null
  category_id: number | null
}

export interface Category {
  id: number
  name: string
} 