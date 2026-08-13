import { httpClient } from "./httpClient";

export interface ShiftDto {
  id: number;
  userId: number;
  employeeName: string | null;
  loginAt: string;
  logoutAt: string | null;
  durationMinutes: number;
  invoiceCount: number;
  salesTotal: number;
  isOpen: boolean;
}

export interface ShiftReportResponse {
  from: string;
  to: string;
  totalShifts: number;
  totalMinutes: number;
  totalInvoices: number;
  totalSales: number;
  shifts: ShiftDto[] | null;
}

export interface ShiftRangeParams {
  from?: string;
  to?: string;
}

function shiftQuery(params: ShiftRangeParams & { userId?: number }): string {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.userId !== undefined) query.set("userId", String(params.userId));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function checkIn(): Promise<ShiftDto> {
  return httpClient.post<ShiftDto>("/shifts/check-in", {});
}

export function checkOut(): Promise<ShiftDto> {
  return httpClient.post<ShiftDto>("/shifts/check-out", {});
}

export function getCurrentShift(): Promise<ShiftDto> {
  return httpClient.get<ShiftDto>("/shifts/current");
}

export function getMyShifts(params: ShiftRangeParams = {}): Promise<ShiftDto[]> {
  return httpClient.get<ShiftDto[]>(`/shifts/my${shiftQuery(params)}`);
}

export function getShiftReport(
  params: ShiftRangeParams & { userId?: number } = {}
): Promise<ShiftReportResponse> {
  return httpClient.get<ShiftReportResponse>(`/shifts/report${shiftQuery(params)}`);
}
