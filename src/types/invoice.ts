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
