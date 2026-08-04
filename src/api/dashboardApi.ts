import { httpClient } from "./httpClient";

export interface DashboardStats {
  todaySalesTotal: number;
  todayInvoicesCount: number;
  monthSalesTotal: number;
  totalInvoicesCount: number;
}

export function getDashboardStats(): Promise<DashboardStats> {
  return httpClient.get<DashboardStats>("/dashboard/stats");
}