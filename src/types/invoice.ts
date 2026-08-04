export type UnitSold = "piece" | "package";
export type DiscountType = "fixed" | "percentage";

export interface InvoiceItemRequest {
  productId: number;
  unitSold: UnitSold;
  quantity: number;
}

export interface FinalizeInvoiceRequest {
  cashierId: number;
  items: InvoiceItemRequest[];
  discountType: DiscountType | null;
  discountValue: number | null;
}

export interface FinalizeInvoiceResponse {
  invoiceId: number;
  invoiceNumber: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: string;
}

export interface InvoiceItemDto {
  invoiceItemId: number;
  productId: number;
  unitSold: UnitSold;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
  alreadyReturnedQuantity: number;
  returnableQuantity: number;
}

export interface GetInvoiceByNumberResponse {
  invoiceId: number;
  invoiceNumber: number;
  cashierId: number;
  hasReturn: boolean;
  subtotal: number;
  total: number;
  createdAt: string;
  items: InvoiceItemDto[];
}

export interface ReturnInvoiceItemRequest {
  invoiceItemId: number;
  returnedQuantity: number;
  processedBy: number;
  reason?: string | null;
}

export interface ReturnInvoiceItemResponse {
  returnId: number;
  invoiceId: number;
  invoiceItemId: number;
  returnedQuantity: number;
  refundAmount: number;
  newSubtotal: number;
  newTotal: number;
  createdAt: string;
}

export interface ExchangeInvoiceItemRequest {
  invoiceItemId: number;
  returnedQuantity: number;
  replacementProductId: number;
  replacementUnitSold: UnitSold;
  replacementQuantity: number;
  processedBy: number;
  reason?: string | null;
}

export interface ExchangeInvoiceItemResponse {
  success: boolean;
  exchangeId: number;
  invoiceId: number;
  invoiceItemId: number;
  returnedQuantity: number;
  replacementProductId: number;
  replacementQuantity: number;
  returnedItemValue: number;
  replacementItemValue: number;
  priceDifference: number;
  newSubtotal: number;
  newTotal: number;
  createdAt: string;
}