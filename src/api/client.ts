export async function apiRequest(
  url: string,
  options: RequestInit = {}
) {

  const token = localStorage.getItem("token");

  return fetch(
    `http://localhost:5090${url}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${token}`,

        ...options.headers,
      },
    }
  );
}