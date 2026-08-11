export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
}