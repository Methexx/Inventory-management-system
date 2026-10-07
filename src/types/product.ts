export interface Product {
  productId: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewProductInput {
  name: string;
  productId: string;
  categoryId: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

export interface EditProductInput {
  name: string;
  categoryId: string;
  price: number;
  lowStockThreshold: number;
}
