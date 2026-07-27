import { httpClient } from "../api/httpClient";
import type {
  FinalizeInvoiceRequest,
  FinalizeInvoiceResponse,
  GetInvoiceByNumberResponse,
} from "../types/invoice";

export const invoiceService = {
  finalize: (payload: FinalizeInvoiceRequest) =>
    httpClient.post<FinalizeInvoiceResponse>("/invoices/finalize", payload),

  getByNumber: (invoiceNumber: number) =>
    httpClient.get<GetInvoiceByNumberResponse>(`/invoices/${invoiceNumber}`),
};