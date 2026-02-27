export interface SavedChart {
  id: string;
  name: string;
  chartType: string;
  settings: Record<string, unknown>;
  data: unknown[][];
  entityColors: Record<string, string>;
  annotations: unknown[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface RecentFile {
  name: string;
  size: number;
  loadedAt: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'racegraph-db';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('charts')) {
          db.createObjectStore('charts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('exports')) {
          db.createObjectStore('exports', { keyPath: 'filename' });
        }
        if (!db.objectStoreNames.contains('cache-meta')) {
          db.createObjectStore('cache-meta');
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // CHARTS
  async saveChart(chart: SavedChart): Promise<string> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('charts', 'readwrite');
      const request = store.put(chart);
      request.onsuccess = () => resolve(chart.id);
      request.onerror = () => reject(request.error);
    });
  }

  async loadChart(id: string): Promise<SavedChart | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('charts', 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async listCharts(): Promise<SavedChart[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('charts', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteChart(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('charts', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  async autoSave(chart: Partial<SavedChart>): Promise<void> {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    this.autoSaveTimeout = setTimeout(async () => {
      try {
        const id = chart.id || 'autosave';
        const existing = await this.loadChart(id);
        const updated = {
          ...existing,
          ...chart,
          id,
          updatedAt: Date.now(),
          createdAt: existing?.createdAt || Date.now()
        } as SavedChart;
        await this.saveChart(updated);
        console.log('Autosaved chart:', id);
      } catch (e) {
        console.error('Autosave failed:', e);
      }
    }, 2000);
  }

  // SETTINGS
  async saveSetting(key: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('settings', 'readwrite');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSetting<T>(key: string, defaultValue: T): Promise<T> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('settings', 'readonly');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result !== undefined ? request.result : defaultValue);
      request.onerror = () => reject(request.error);
    });
  }

  async loadAllSettings(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('settings', 'readonly');
      const request = store.getAll();
      const keysRequest = store.getAllKeys();
      
      request.onsuccess = () => {
        keysRequest.onsuccess = () => {
          const settings: Record<string, unknown> = {};
          const keys = keysRequest.result as string[];
          const values = request.result;
          for (let i = 0; i < keys.length; i++) {
            settings[keys[i]] = values[i];
          }
          resolve(settings);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }

  // RECENT FILES
  async addRecentFile(name: string, size: number): Promise<void> {
    const recent: RecentFile = { name, size, loadedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const store = this.getStore('exports', 'readwrite');
      const request = store.put(recent);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentFiles(): Promise<RecentFile[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('exports', 'readonly');
      const request = store.getAll();
      request.onsuccess = () => {
        const files = (request.result || []) as RecentFile[];
        resolve(files.sort((a, b) => b.loadedAt - a.loadedAt));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // UTILITY
  async getStorageUsed(): Promise<{ used: number, quota: number, percent: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 1;
        return { used, quota, percent: (used / quota) * 100 };
      } catch (e) {
        console.error('Failed to estimate storage:', e);
      }
    }
    return { used: 0, quota: 1, percent: 0 };
  }

  async exportAllData(): Promise<Blob> {
    const charts = await this.listCharts();
    const settings = await this.loadAllSettings();
    const exports = await this.getRecentFiles();
    const data = JSON.stringify({ charts, settings, exports });
    return new Blob([data], { type: 'application/json' });
  }

  async importData(blob: Blob): Promise<void> {
    const text = await blob.text();
    const data = JSON.parse(text);
    if (data.charts) {
      for (const chart of data.charts) await this.saveChart(chart);
    }
    if (data.settings) {
      for (const [k, v] of Object.entries(data.settings)) await this.saveSetting(k, v);
    }
    if (data.exports) {
      for (const exp of data.exports) await this.addRecentFile(exp.name, exp.size);
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) return;
    const storeNames = Array.from(this.db.objectStoreNames);
    for (const name of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const store = this.getStore(name, 'readwrite');
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  }
}

export const offlineStorage = new OfflineStorage();
