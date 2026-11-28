// The backend's session cookie is SameSite=Lax, so the browser only sends it
// when the page and the API are on the same site. localhost and 127.0.0.1 are
// different sites, so by default the API address uses the same host name as the
// page: http://localhost:5173 talks to http://localhost:5000, and
// http://127.0.0.1:5173 talks to http://127.0.0.1:5000. Set VITE_API_BASE_URL
// in .env.local to use a different address.
function defaultApiBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:5000";
  return `${window.location.protocol}//${window.location.hostname}:5000`;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl();

// Called when a request is rejected with 401 (no valid session). AuthContext
// registers a handler so an expired session signs the user out in the UI.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.(endpoint);

    // Validation errors arrive as {"error": "Validation failed", "details":
    // {"field": "reason"}}. Include the reasons so the user can act on them.
    const details =
      data.details && typeof data.details === "object" ? data.details : {};
    const reasons = Object.entries(details)
      .map(([field, reason]) => `${field.replace(/_/g, " ")}: ${reason}`)
      .join("; ");
    const base = data.error || `Request failed (${response.status})`;

    const error = new Error(reasons ? `${base} (${reasons})` : base);
    error.status = response.status;
    error.details = details;
    throw error;
  }

  return data;
}
