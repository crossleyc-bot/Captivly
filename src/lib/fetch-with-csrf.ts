/**
 * Read the CSRF token from the cookie.
 * Returns empty string if not found (SSR or cookie not yet set).
 */
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : "";
}

/**
 * Wrapper around fetch that automatically includes the CSRF token header
 * for non-GET requests to internal API routes.
 */
export async function fetchWithCsrf(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    const headers = new Headers(init?.headers);
    headers.set("x-csrf-token", getCsrfToken());
    return fetch(url, { ...init, headers });
  }

  return fetch(url, init);
}
