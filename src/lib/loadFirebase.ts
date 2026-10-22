/**
 * Loads the Firebase module (database, auth, analytics) on demand, so public
 * pages don't download it before they're on screen.
 *
 * - `loadFirebase()` starts the download (once) and resolves to the module.
 * - `whenIdle(fn)` runs `fn` after the page has loaded and the browser is idle.
 * - `logAnalyticsEvent()` forwards to Analytics once it's running. Events sent
 *   before then are dropped, as they always were: Analytics records its own
 *   first page view when it starts.
 */
type FirebaseModule = typeof import("./firebase");

let modulePromise: Promise<FirebaseModule> | null = null;
let loaded: FirebaseModule | null = null;

export const loadFirebase = (): Promise<FirebaseModule> =>
  (modulePromise ??= import("./firebase").then((m) => (loaded = m)));

export const whenIdle = (fn: () => void, timeout = 4000) => {
  // Skipped in Node and while the build pre-renders pages (scripts/prerender.ts).
  if (typeof window === "undefined" || (window as { __PRERENDER__?: boolean }).__PRERENDER__) return;
  const run = () => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout });
    else setTimeout(fn, 1500);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
};

export const logAnalyticsEvent = (eventName: string, params?: Record<string, unknown>) => {
  loaded?.logAnalyticsEvent(eventName, params);
};
