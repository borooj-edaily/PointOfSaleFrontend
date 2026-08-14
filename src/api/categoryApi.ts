import { httpClient } from "./httpClient";
import type { Category, CreateCategoryRequest } from "../types/category";

// أعد تصدير Category عشان أي ملف يقدر يستوردها من هون مباشرة
// (بنفس نمط productApi.ts اللي بيصدّر SellByType مباشرة من جواه)
export type { Category };

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

// Mirrors Pos.Api/Features/Categories/Update/UpdateCategoryCommand.cs
export interface UpdateCategoryRequest {
  name: string;
}

export async function updateCategory(
  id: number,
  data: UpdateCategoryRequest,
  updatedByUserId: number | null
): Promise<void> {
  return httpClient.patch<void>(`/categories/${id}`, { id, ...data, updatedByUserId });
}

export async function deactivateCategory(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/categories/${id}/deactivate`, { id, updatedByUserId });
}

export function activateCategory(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/categories/${id}/activate`, { id, updatedByUserId });
}