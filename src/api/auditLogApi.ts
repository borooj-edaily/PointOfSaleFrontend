import { httpClient } from "./httpClient";

export interface AuditLog {
  id: number;
  userId: number;
  userFullName: string | null;
  action: string | null;
  entity: string | null;
  entityId: number | null;
  details: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: AuditLog[] | null;
}

export interface GetAuditLogsParams {
  from?: string;
  to?: string;
  userId?: number;
  action?: string;
  entity?: string;
  page?: number;
  pageSize?: number;
}

export function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<AuditLogsResponse> {
  const query = new URLSearchParams();

  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.userId !== undefined) query.set("userId", String(params.userId));
  if (params.action) query.set("action", params.action);
  if (params.entity) query.set("entity", params.entity);

  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 50));

  return httpClient.get<AuditLogsResponse>(
    `/audit-logs?${query.toString()}`
  );
}