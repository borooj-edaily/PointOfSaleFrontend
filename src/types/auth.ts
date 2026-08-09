export interface LoginRequest {
  username: string;
  password: string;
}


export interface LoginResponseUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: LoginResponseUser;
}

export interface StoredUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  permissions: string[];
}