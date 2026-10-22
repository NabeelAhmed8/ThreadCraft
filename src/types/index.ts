export interface Product {
  id: string | number;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  sizes: string[];
  colors?: string[];
  images: string[];
  inStock: boolean;
  stockCount?: number;
  featured?: boolean;
  createdAt?: string;
}

export interface CartItem {
  id: string; // unique item key: productId + size + color
  productId: string | number;
  name: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  quantity: number;
}

export interface Category {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface OrderCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderPayload {
  customer: OrderCustomer;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: "cod" | "card" | "stripe";
  notes?: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string | number;
  message?: string;
}
