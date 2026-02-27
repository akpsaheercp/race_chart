import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './pwa/pwa.css';

import { swManager } from './pwa/ServiceWorkerManager';
import { offlineStorage } from './pwa/OfflineStorage';
import { pwaUi } from './pwa/PwaUiManager';
import { handleShareTarget } from './pwa/ShareTargetHandler';
import { setupFileHandling } from './pwa/FileHandler';
import { setupWindowControlsOverlay } from './pwa/WindowControlsOverlay';

async function initPWA() {
  await offlineStorage.init();
  await swManager.init();
  pwaUi.init();
  handleShareTarget();
  setupFileHandling();
  setupWindowControlsOverlay();
  
  const storage = await offlineStorage.getStorageUsed();
  if (storage.percent > 80) pwaUi.showStorageWarning(storage);
}

initPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
