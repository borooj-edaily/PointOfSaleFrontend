export interface Category {
  id: number;
  name: string;
  isActive: boolean;
  productsCount: number;
}

export interface CreateCategoryRequest {
  name: string;
}