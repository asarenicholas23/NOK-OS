import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, {preloadRoute} from './App.tsx';
import './index.css';

// Local test mode: make it impossible to mistake emulator data for production.
if (import.meta.env.VITE_USE_EMULATORS === "1") {
  const banner = document.createElement("div");
  banner.textContent = "LOCAL TEST DATA · Firebase emulators · nothing here touches production";
  banner.setAttribute("style", "position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#f59e0b;color:#111;font:600 12px/1.8 system-ui,sans-serif;text-align:center;pointer-events:none");
  document.body.appendChild(banner);
}

// Fetch the current page's code first, so the first render shows the page
// itself (matching the pre-rendered HTML) rather than a loading state.
preloadRoute(window.location.pathname)
  .catch(() => {})
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
