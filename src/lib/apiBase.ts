import { auth } from "./firebase";

// Backend origin for our /api/* routes. Production builds default to the Render
// service; override with VITE_API_URL at build time if that ever changes. Local
// dev stays same-origin (empty), where `tsx server.ts` serves the SPA and API
// together.
const PROD_API_URL = "https://nok-os-api.onrender.com";
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : "");

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
