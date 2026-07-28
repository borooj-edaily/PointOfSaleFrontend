import { httpClient } from "../api/httpClient";
import type {
  ExchangeInvoiceItemRequest,
  ExchangeInvoiceItemResponse,
  FinalizeInvoiceRequest,
  FinalizeInvoiceResponse,
  GetInvoiceByNumberResponse,
} from "../types/invoice";

export const invoiceService = {
  finalize: (payload: FinalizeInvoiceRequest) =>
    httpClient.post<FinalizeInvoiceResponse>("/invoices/finalize", payload),

  getByNumber: (invoiceNumber: number) =>
    httpClient.get<GetInvoiceByNumberResponse>(`/invoices/${invoiceNumber}`),

  exchange: (payload: ExchangeInvoiceItemRequest) =>
    httpClient.post<ExchangeInvoiceItemResponse>("/invoices/exchange", payload),
};