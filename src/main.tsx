import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, {preloadRoute} from './App.tsx';
import './index.css';

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
