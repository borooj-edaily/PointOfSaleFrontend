import { httpClient } from "./httpClient";

export interface UserDto {
  id: number;
  fullName: string | null;
  username: string | null;
  role: string | null;
  isActive: boolean;
  createdAt: string;
  permissions: string[] | null;
}

export interface PermissionDto {
  id: number;
  name: string | null;
  description: string | null;
}

export interface CreateUserPayload {
  fullName: string;
  username: string;
  password: string;
  role: string;
  permissionIds: number[];
}

export interface UpdateUserPayload {
  fullName: string;
  username: string;
  role: string;
  newPassword?: string | null;
}

export function getUsers(): Promise<UserDto[]> {
  return httpClient.get<UserDto[]>("/users");
}

export function getUserById(userId: number): Promise<UserDto> {
  return httpClient.get<UserDto>(`/users/${userId}`);
}

export function createUser(payload: CreateUserPayload): Promise<UserDto> {
  return httpClient.post<UserDto>("/users", payload);
}

export function updateUser(userId: number, payload: UpdateUserPayload): Promise<UserDto> {
  return httpClient.put<UserDto>(`/users/${userId}`, payload);
}

export function activateUser(userId: number): Promise<void> {
  return httpClient.patch<void>(`/users/${userId}/activate`, {});
}

export function deactivateUser(userId: number): Promise<void> {
  return httpClient.patch<void>(`/users/${userId}/deactivate`, {});
}

export function setUserPermissions(userId: number, permissionIds: number[]): Promise<UserDto> {
  return httpClient.put<UserDto>(`/users/${userId}/permissions`, { permissionIds });
}

export function getPermissions(): Promise<PermissionDto[]> {
  return httpClient.get<PermissionDto[]>("/users/permissions");
}
