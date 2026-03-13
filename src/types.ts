export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string | number;
  category?: string;
  subcategory_id: string | number;
  featured: boolean | number;
  best_seller: boolean | number;
  variations: any; // Can be string (from DB) or object (parsed)
  active?: boolean | number;
  code?: string;
}

export interface Category {
  id: string | number;
  name: string;
}

export interface Subcategory {
  id: string | number;
  category_id: string | number;
  name: string;
}

export interface User {
  id: string | number;
  email: string;
  role: 'admin' | 'editor' | 'customer' | 'viewer';
  name: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariation?: string;
}
