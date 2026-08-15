import { httpClient } from "./httpClient";

// Mirrors Pos.Api/Features/Invoices/ListInvoices.cs -> InvoiceListItemDto
export interface InvoiceListItem {
  invoiceId: number;
  invoiceNumber: number;
  cashierId: number;
  cashierName: string;
  hasReturn: boolean;
  subtotal: number;
  total: number;
  createdAt: string;
  isDebt: boolean;
  debtorNickname: string | null;
  debtPaidAt: string | null;
}

export interface ListInvoicesResponse {
  items: InvoiceListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ListInvoicesParams {
  // Only honored by the backend when the current user has view_all_invoices
  // (or is Admin) — a cashier without that permission always sees only their
  // own invoices, regardless of what's sent here.
  cashierId?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export function listInvoices(
  params: ListInvoicesParams = {}
): Promise<ListInvoicesResponse> {
  const query = new URLSearchParams();

  if (params.cashierId !== undefined) {
    query.set("cashierId", String(params.cashierId));
  }
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  return httpClient.get<ListInvoicesResponse>(`/invoices?${query.toString()}`);
}