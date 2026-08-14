const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:5090/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function extractMessage(details: unknown, fallback: string): string {
  if (
    typeof details === "object" &&
    details !== null &&
    "message" in details &&
    typeof (details as { message: unknown }).message === "string"
  ) {
    const response = details as { message: string; errors?: unknown };

    if (Array.isArray(response.errors) && response.errors.length > 0) {
      const validationMessages = response.errors
        .filter((error): error is string => typeof error === "string")
        .join(" ");

      if (validationMessages) {
        return validationMessages;
      }
    }

    return response.message;
  }

  return fallback;
}

function handleUnauthorized() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new ApiError("Session expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = undefined;
    }

    throw new ApiError(
      extractMessage(details, `Request to ${path} failed`),
      response.status,
      details
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  return JSON.parse(text) as TResponse;
}

export const httpClient = {
  get: <TResponse>(path: string) =>
    request<TResponse>(path, { method: "GET" }),

  post: <TResponse>(path: string, body: unknown) =>
    request<TResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <TResponse>(path: string, body: unknown) =>
    request<TResponse>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: <TResponse>(path: string, body: unknown) =>
    request<TResponse>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
