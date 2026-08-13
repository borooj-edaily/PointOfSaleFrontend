import { httpClient } from "./httpClient";

export interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  createdByUserId: number | null;
}

export interface UpdateCategoryPayload {
  id: number;
  name: string;
  updatedByUserId: number | null;
}

export interface DeactivateCategoryPayload {
  id: number;
  updatedByUserId: number | null;
}

export function getAllCategories(
  onlyActive = true
): Promise<Category[]> {
  return httpClient.get<Category[]>(
    `/categories?onlyActive=${onlyActive}`
  );
}

export function getCategoryById(
  categoryId: number
): Promise<Category> {
  return httpClient.get<Category>(
    `/categories/${categoryId}`
  );
}

export function createCategory(
  payload: CreateCategoryPayload
): Promise<void> {
  return httpClient.post<void>("/categories", payload);
}

export function updateCategory(
  categoryId: number,
  payload: UpdateCategoryPayload
): Promise<void> {
  return httpClient.put<void>(
    `/categories/${categoryId}`,
    payload
  );
}

export function deactivateCategory(
  categoryId: number,
  payload: DeactivateCategoryPayload
): Promise<void> {
  return httpClient.patch<void>(
    `/categories/${categoryId}/deactivate`,
    payload
  );
}