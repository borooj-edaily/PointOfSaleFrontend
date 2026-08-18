export type UnitSold = "piece" | "package";
export type DiscountType = "fixed" | "percentage";

export interface InvoiceItemRequest {
  productId: number;
  unitSold: UnitSold;
  quantity: number;
  overridePrice?: number | null;
  overrideReason?: string | null;
}

export interface FinalizeInvoiceRequest {
  cashierId: number;
  items: InvoiceItemRequest[];
  discountType: DiscountType | null;
  discountValue: number | null;
  isDebt?: boolean;
  customerId?: number | null;
  debtorNickname?: string | null;
}

export interface FinalizeInvoiceResponse {
  invoiceId: number;
  invoiceNumber: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  isDebt: boolean;
  customerId: number | null;
  debtorNickname: string | null;
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
  originalUnitPrice: number | null;
  priceOverrideReason: string | null;
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
  isDebt: boolean;
  debtorNickname: string | null;
  debtPaidAt: string | null;
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