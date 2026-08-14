import { httpClient } from "./httpClient";
import type { Product } from "../types/catalog";

// Mirrors Pos.Api/Enums/SellByType.cs on the backend (Piece = 1, Package = 2, Both = 3)
export type SellByType = 1 | 2 | 3;

// Mirrors Pos.Api/Features/Products/GetAll/ProductDto.cs
export interface ProductDto {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  sellBy: SellByType;
  piecesPerPackage: number | null;
  pricePerPiece: number | null;
  pricePerPackage: number | null;
  stockInPieces: number;
  isActive: boolean;
}

function mapProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    pricePerPiece: dto.pricePerPiece ?? 0,
    pricePerPackage: dto.pricePerPackage,
    piecesPerPackage: dto.piecesPerPackage,
    stockInPieces: dto.stockInPieces,
    isActive: dto.isActive,
  };
}

export interface GetProductsParams {
  categoryId?: number;
  search?: string;
  onlyActive?: boolean;
}

export async function getAllProducts(params: GetProductsParams = {}): Promise<Product[]> {
  const dtos = await getAllProductDetails(params);
  return dtos.map(mapProduct);
}

/** Full backend record for management screens; cart screens use getAllProducts instead. */
export async function getAllProductDetails(
  params: GetProductsParams = {}
): Promise<ProductDto[]> {
  const query = new URLSearchParams();
  query.set("onlyActive", String(params.onlyActive ?? true));
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.search) query.set("search", params.search);

  return httpClient.get<ProductDto[]>(`/products?${query.toString()}`);
}

// Mirrors Pos.Api/Features/Products/Create/CreateProductCommand.cs
export interface CreateProductPayload {
  name: string;
  categoryId: number;
  sellBy: SellByType;
  piecesPerPackage: number | null;
  pricePerPiece: number | null;
  pricePerPackage: number | null;
  stockInPieces: number;
  createdByUserId: number | null;
}

export function createProduct(payload: CreateProductPayload): Promise<{ id: number }> {
  return httpClient.post<{ id: number }>("/products", payload);
}

// Mirrors Pos.Api/Features/Products/Update/UpdateProductCommand.cs
export interface UpdateProductPayload {
  id: number;
  name: string;
  categoryId: number;
  sellBy: SellByType;
  piecesPerPackage: number | null;
  pricePerPiece: number | null;
  pricePerPackage: number | null;
  updatedByUserId: number | null;
}

export function getProductById(productId: number): Promise<ProductDto> {
  return httpClient.get<ProductDto>(`/products/${productId}`);
}

export function updateProduct(
  productId: number,
  payload: UpdateProductPayload
): Promise<void> {
  return httpClient.put<void>(`/products/${productId}`, payload);
}

export function deactivateProduct(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/products/${id}/deactivate`, { id, updatedByUserId });
}

export function activateProduct(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/products/${id}/activate`, { id, updatedByUserId });
}

// Mirrors Pos.Api/Features/Products/LowStock/LowStockDto.cs
export interface LowStockDto {
  id: number;
  name: string;
  categoryName: string;
  stockInPieces: number;
}

export function getLowStockProducts(threshold = 10): Promise<LowStockDto[]> {
  return httpClient.get<LowStockDto[]>(`/products/low-stock?threshold=${threshold}`);
}