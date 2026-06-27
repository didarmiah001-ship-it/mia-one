import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';

// Seed the theme before React paints to avoid flash
;(function() {
  try {
    const saved = localStorage.getItem('mia-one-theme') as 'dark' | 'light' | 'system' | null;
    const mode  = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
    const resolved =
      mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch { document.documentElement.setAttribute('data-theme', 'dark'); }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // When a new SW finishes installing, check if this is an update
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // 'installed' + existing controller = update ready
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(
              new CustomEvent('pwa-update-available', { detail: { reg } })
            );
          }
        });
      });

      // Poll every 60 s so long-running sessions also pick up new deploys
      setInterval(() => reg.update(), 60_000);
    }).catch(() => {
      // SW registration failed — app still works without it
    });

    // When a new SW takes control, reload all tabs to use the fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
