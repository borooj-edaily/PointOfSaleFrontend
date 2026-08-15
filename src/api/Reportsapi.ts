import { httpClient } from "./httpClient";

// Mirrors Pos.Api/Features/Reports/SalesReport.cs
export interface DailySalesPoint {
  date: string;
  invoiceCount: number;
  totalSales: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface CashierSales {
  cashierId: number;
  cashierName: string;
  invoiceCount: number;
  totalSales: number;
}

export interface SalesReport {
  fromDate: string;
  toDate: string;
  totalInvoices: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  totalReturnsValue: number;
  averageInvoiceValue: number;
  dailyBreakdown: DailySalesPoint[];
  topProducts: TopProduct[];
  salesByCashier: CashierSales[];
}

export interface GetSalesReportParams {
  fromDate?: string;
  toDate?: string;
}

export function getSalesReport(
  params: GetSalesReportParams = {}
): Promise<SalesReport> {
  const query = new URLSearchParams();

  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);

  const qs = query.toString();

  return httpClient.get<SalesReport>(`/reports/sales${qs ? `?${qs}` : ""}`);
}