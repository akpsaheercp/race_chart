import { Workbox } from 'workbox-window';

export type SWStatus = 'not-supported' | 'installing' | 'waiting' | 'active' | 'redundant';

class ServiceWorkerManager {
  private wb: Workbox | null = null;
  public updateAvailable = false;
  private status: SWStatus = 'not-supported';

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      this.wb = new Workbox('/sw.js');

      this.wb.addEventListener('installed', (event) => {
        if (!event.isUpdate) {
          console.log('Service worker installed for the first time');
          this.status = 'active';
        }
      });

      this.wb.addEventListener('waiting', () => {
        console.log('New service worker is waiting to activate');
        this.status = 'waiting';
        this.onUpdateFound();
      });

      this.wb.addEventListener('activated', (event) => {
        if (!event.isUpdate) {
          console.log('Service worker activated');
        } else {
          console.log('Service worker updated');
        }
        this.status = 'active';
      });

      try {
        // Skip registration if in an iframe and it's likely to fail
        const isIframe = window.self !== window.top;
        if (isIframe) {
          console.warn('Service worker registration skipped: Running in an iframe');
          this.status = 'not-supported';
          return;
        }

        await this.wb.register();
        this.setupNetworkDetection();
      } catch (err: any) {
        if (err.name === 'SecurityError' || err.message?.includes('insecure')) {
          console.warn('Service worker registration blocked by browser security (likely due to iframe or local dev):', err.message);
        } else {
          console.error('Service worker registration failed:', err);
        }
        this.status = 'not-supported';
      }
    }
  }

  private onUpdateFound(): void {
    this.updateAvailable = true;
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  async applyUpdate(): Promise<void> {
    if (this.wb && this.updateAvailable) {
      this.wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      this.wb.messageSkipWaiting();
    }
  }

  private setupNetworkDetection(): void {
    window.addEventListener('online', () => {
      window.dispatchEvent(new CustomEvent('pwa-online'));
    });
    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('pwa-offline'));
    });
  }

  async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log(`Registered background sync: ${tag}`);
      } catch (err) {
        console.error('Background sync registration failed:', err);
      }
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async getCacheSize(): Promise<string> {
    if (!('caches' in window)) return '0 B';
    let totalSize = 0;
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
    } catch (e) {
      console.error('Failed to calculate cache size', e);
    }
    return (totalSize / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) return;
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('All caches cleared');
    } catch (e) {
      console.error('Failed to clear caches', e);
    }
  }

  async precacheData(data: object, key: string): Promise<void> {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open('app-data-cache');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(new Request(`/api/data/${key}`), response);
    } catch (e) {
      console.error('Failed to precache data', e);
    }
  }

  getStatus(): SWStatus {
    return this.status;
  }
}

export const swManager = new ServiceWorkerManager();
