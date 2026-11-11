import { isNativeApp } from './ads/config';
import React from 'react';
import { Capacitor } from '@capacitor/core';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// Os ajustes de área segura não devem afetar o site nem a PWA no navegador.
if (Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-android');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Carrega Google Tag Manager apenas na WEB e somente após consentimento.
if (!isNativeApp) {
  const consentScript = document.createElement('script');
  consentScript.src = '/assets/qrlivre-consent.js';
  consentScript.async = true;
  document.head.appendChild(consentScript);
}
