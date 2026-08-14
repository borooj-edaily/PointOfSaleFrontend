import { httpClient } from "./httpClient";

// Mirrors Pos.Api/Enums/StockMovementType.cs
export const StockMovementType = {
  Restock: 1,
  Sale: 2,
  Return: 3,
  ManualDeduction: 4,
  ManualAddition: 5,
} as const;

export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType];

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.Restock]: "Stock Restock",
  [StockMovementType.Sale]: "Sale",
  [StockMovementType.Return]: "Return",
  [StockMovementType.ManualDeduction]: "Manual Deduction",
  [StockMovementType.ManualAddition]: "Manual Addition",
};

// Mirrors Pos.Api/Features/StockMovements/CurrentStock/CurrentStockDto.cs
export interface CurrentStockDto {
  productId: number;
  productName: string;
  stockInPieces: number;
  isActive: boolean;
}

// Mirrors Pos.Api/Features/StockMovements/GetHistory/StockMovementDto.cs
export interface StockMovementDto {
  id: number;
  productId: number;
  type: StockMovementType;
  quantityInPieces: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  referenceInvoiceId: number | null;
  createdAt: string;
  createdByUserId: number | null;
}

// Mirrors Pos.Api/Features/StockMovements/Restock/RestockCommand.cs
export interface RestockPayload {
  quantity: number;
  isPackage: boolean;
  createdByUserId: number | null;
}

// Mirrors Pos.Api/Features/StockMovements/Deduct/DeductStockCommand.cs
export interface DeductStockPayload {
  quantity: number;
  isPackage: boolean;
  reason: string;
  createdByUserId: number | null;
}

export function getCurrentStock(productId: number): Promise<CurrentStockDto> {
  return httpClient.get<CurrentStockDto>(`/products/${productId}/stock`);
}

export function restockProduct(
  productId: number,
  payload: RestockPayload
): Promise<{ movementId: number }> {
  return httpClient.post<{ movementId: number }>(
    `/products/${productId}/stock/restock`,
    payload
  );
}

export function deductStock(
  productId: number,
  payload: DeductStockPayload
): Promise<{ movementId: number }> {
  return httpClient.post<{ movementId: number }>(
    `/products/${productId}/stock/deduct`,
    payload
  );
}

export function getStockHistory(productId: number): Promise<StockMovementDto[]> {
  return httpClient.get<StockMovementDto[]>(`/products/${productId}/stock/history`);
}