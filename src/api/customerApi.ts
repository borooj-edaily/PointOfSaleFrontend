import { httpClient } from "./httpClient";
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerDebtHistory,
} from "../types/customer";

export type { Customer };

export interface GetAllCustomersParams {
  onlyActive?: boolean;
  search?: string;
}

export async function getAllCustomers(params: GetAllCustomersParams = {}): Promise<Customer[]> {
  const query = new URLSearchParams();
  if (params.onlyActive) query.set("onlyActive", "true");
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  return httpClient.get<Customer[]>(`/customers${qs ? `?${qs}` : ""}`);
}

export async function getCustomerById(id: number): Promise<Customer> {
  return httpClient.get<Customer>(`/customers/${id}`);
}

export async function getCustomerDebtHistory(id: number): Promise<CustomerDebtHistory> {
  return httpClient.get<CustomerDebtHistory>(`/customers/${id}/debts`);
}

export async function createCustomer(data: CreateCustomerRequest): Promise<{ id: number }> {
  return httpClient.post<{ id: number }>("/customers", data);
}

export async function updateCustomer(id: number, data: UpdateCustomerRequest): Promise<void> {
  return httpClient.put<void>(`/customers/${id}`, { id, ...data });
}

export async function deactivateCustomer(id: number): Promise<void> {
  return httpClient.post<void>(`/customers/${id}/deactivate`, {});
}
