import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Fonts
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
