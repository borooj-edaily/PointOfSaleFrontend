import type {
  LoginRequest,
  LoginResponse,
  StoredUser,
} from "../types/auth";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5090/api";

export async function login(
  request: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data
    ) {
      throw new Error(String(data.message));
    }

    throw new Error("Login failed");
  }

  return data as LoginResponse;
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("token"));
}

export function getCurrentUser(): StoredUser | null {
  const raw = localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem("token");

  try {
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // The local logout must still happen if the server is unavailable.
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}