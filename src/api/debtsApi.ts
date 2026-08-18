import { httpClient } from "./httpClient";

// Mirrors Pos.Api/Features/Invoices/Debts.cs -> DebtListItemDto
export interface DebtListItem {
  invoiceId: number;
  invoiceNumber: number;
  debtorNickname: string;
  customerId: number | null;
  customerPhone: string | null;
  cashierId: number;
  cashierName: string;
  total: number;
  createdAt: string;
  debtPaidAt: string | null;
  isPaid: boolean;
}

export interface ListDebtsResponse {
  items: DebtListItem[];
  totalOutstanding: number;
}

export interface ListDebtsParams {
  onlyUnpaid?: boolean;
  nickname?: string;
}

export function listDebts(params: ListDebtsParams = {}): Promise<ListDebtsResponse> {
  const query = new URLSearchParams();
  query.set("onlyUnpaid", String(params.onlyUnpaid ?? true));
  if (params.nickname) query.set("nickname", params.nickname);

  return httpClient.get<ListDebtsResponse>(`/invoices/debts?${query.toString()}`);
}

export interface MarkDebtPaidResponse {
  invoiceNumber: number;
  debtPaidAt: string;
}

export function payDebt(invoiceNumber: number): Promise<MarkDebtPaidResponse> {
  return httpClient.post<MarkDebtPaidResponse>(`/invoices/${invoiceNumber}/pay-debt`, {});
}