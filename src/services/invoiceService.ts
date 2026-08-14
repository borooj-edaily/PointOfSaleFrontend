import { httpClient } from "../api/httpClient";
import type {
  ExchangeInvoiceItemRequest,
  ExchangeInvoiceItemResponse,
  FinalizeInvoiceRequest,
  FinalizeInvoiceResponse,
  GetInvoiceByNumberResponse,
  ReturnInvoiceItemRequest,
  ReturnInvoiceItemResponse,
} from "../types/invoice";

export const invoiceService = {
  finalize: (payload: FinalizeInvoiceRequest) =>
    httpClient.post<FinalizeInvoiceResponse>(
      "/invoices/finalize",
      payload
    ),

  getByNumber: (invoiceNumber: number) =>
    httpClient.get<GetInvoiceByNumberResponse>(
      `/invoices/${invoiceNumber}`
    ),

  exchange: (payload: ExchangeInvoiceItemRequest) =>
    httpClient.post<ExchangeInvoiceItemResponse>(
      "/invoices/exchange",
      payload
    ),

  returnItem: (payload: ReturnInvoiceItemRequest) =>
    httpClient.post<ReturnInvoiceItemResponse>(
      "/invoices/returns",
      payload
    ),
};