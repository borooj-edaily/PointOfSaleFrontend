import { httpClient } from "../api/httpClient";
import type { FinalizeInvoiceRequest, FinalizeInvoiceResponse } from "../types/invoice";

export const invoiceService = {
  finalize: (payload: FinalizeInvoiceRequest) =>
    httpClient.post<FinalizeInvoiceResponse>("/invoices/finalize", payload),
};
