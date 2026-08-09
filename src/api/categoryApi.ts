import { httpClient } from "./httpClient";

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export function getAllCategories(onlyActive = true): Promise<Category[]> {
  return httpClient.get<Category[]>(`/categories?onlyActive=${onlyActive}`);
}