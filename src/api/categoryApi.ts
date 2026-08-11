import { httpClient } from "./httpClient";
import type { Category, CreateCategoryRequest } from "../types/category";

export async function getAllCategories(params?: { onlyActive?: boolean }): Promise<Category[]> {
  const query = params?.onlyActive ? "?onlyActive=true" : "";
  return httpClient.get<Category[]>(`/categories${query}`);
}

export async function getCategoryById(id: number): Promise<Category> {
  return httpClient.get<Category>(`/categories/${id}`);
}

export async function createCategory(data: CreateCategoryRequest): Promise<{ id: number }> {
  return httpClient.post<{ id: number }>("/categories", data);
}

export async function deactivateCategory(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/categories/${id}/deactivate`, { id, updatedByUserId });
}