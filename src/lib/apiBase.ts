import { auth } from "./firebase";

// Set VITE_API_URL to the deployed backend origin (e.g. Render service URL).
// Left empty for local dev, where the Express server serves the SPA and API from the same origin.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Wraps fetch() for our own /api/* routes: prefixes the API host and attaches
// the signed-in staff member's Firebase ID token so the server can verify the caller.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const user = auth.currentUser;
  if (user) {
    const idToken = await user.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
