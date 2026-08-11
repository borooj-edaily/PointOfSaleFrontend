import { httpClient } from "./httpClient";
import type { Product } from "../types/catalog";

// Mirrors Pos.Api/Enums/SellByType.cs on the backend (Piece = 1, Package = 2, Both = 3)
export type SellByType = 1 | 2 | 3;

// Mirrors Pos.Api/Features/Products/GetAll/ProductDto.cs
interface ProductDto {
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
  };
}

export interface GetProductsParams {
  categoryId?: number;
  search?: string;
  onlyActive?: boolean;
}

export async function getAllProducts(params: GetProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  query.set("onlyActive", String(params.onlyActive ?? true));
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.search) query.set("search", params.search);

  const dtos = await httpClient.get<ProductDto[]>(`/products?${query.toString()}`);
  return dtos.map(mapProduct);
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
export function deactivateProduct(id: number, updatedByUserId: number | null): Promise<void> {
  return httpClient.patch<void>(`/products/${id}/deactivate`, { id, updatedByUserId });
}