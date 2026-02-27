import React, { useState, useEffect } from 'react';
import { Smartphone, HardDrive, Download, Upload, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { swManager } from '../../../pwa/ServiceWorkerManager';
import { offlineStorage, SavedChart } from '../../../pwa/OfflineStorage';
import { pwaUi } from '../../../pwa/PwaUiManager';

export default function PwaSettingsPanel() {
  const [storage, setStorage] = useState({ used: 0, quota: 1, percent: 0 });
  const [cacheSize, setCacheSize] = useState('0 B');
  const [swStatus, setSwStatus] = useState(swManager.getStatus());
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setStorage(await offlineStorage.getStorageUsed());
      setCacheSize(await swManager.getCacheSize());
      setSavedCharts(await offlineStorage.listCharts());
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: window-controls-overlay)').matches);
    };
    
    loadData();
    
    const interval = setInterval(() => {
      setSwStatus(swManager.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cached assets? The app will need to re-download them.')) {
      await swManager.clearAllCaches();
      setCacheSize(await swManager.getCacheSize());
      pwaUi.showToast('Cache cleared successfully');
    }
  };

  const handleExportData = async () => {
    const blob = await offlineStorage.exportAllData();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `racegraph_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await offlineStorage.importData(file);
          setSavedCharts(await offlineStorage.listCharts());
          pwaUi.showToast('Data imported successfully');
        } catch (err) {
          pwaUi.showToast('Failed to import data');
          console.error(err);
        }
      }
    };
    input.click();
  };

  const handleResetApp = async () => {
    if (confirm('WARNING: This will delete all saved charts, settings, and caches. This cannot be undone. Continue?')) {
      await offlineStorage.clearAll();
      await swManager.clearAllCaches();
      window.location.reload();
    }
  };

  const handleDeleteChart = async (id: string) => {
    if (confirm('Delete this saved chart?')) {
      await offlineStorage.deleteChart(id);
      setSavedCharts(await offlineStorage.listCharts());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Smartphone className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">App & Storage</h2>
          <p className="text-xs text-zinc-500">Manage offline data and PWA settings</p>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">App Status</span>
          <div className="flex items-center gap-2 text-xs font-bold">
            {isInstalled ? (
              <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-4 h-4" /> Installed</span>
            ) : (
              <span className="text-zinc-500">Browser Mode</span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Service Worker</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${swStatus === 'active' ? 'bg-green-500/20 text-green-500' : swStatus === 'waiting' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-500/20 text-zinc-500'}`}>
            {swStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Storage Usage</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{(storage.used / 1024 / 1024).toFixed(1)} MB used</span>
            <span>{(storage.quota / 1024 / 1024).toFixed(1)} MB total</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${storage.percent > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} 
              style={{ width: `${Math.min(100, storage.percent)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
          <div className="p-3 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 mb-1">Asset Cache</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-white">{cacheSize}</div>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 mb-1">Saved Charts</div>
            <div className="font-mono font-bold text-zinc-900 dark:text-white">{savedCharts.length}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white px-1">Data Management</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExportData} className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors">
            <Download className="w-4 h-4" /> Backup Data
          </button>
          <button onClick={handleImportData} className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors">
            <Upload className="w-4 h-4" /> Restore Data
          </button>
          <button onClick={handleClearCache} className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors">
            <RefreshCw className="w-4 h-4" /> Clear Cache
          </button>
          <button onClick={handleResetApp} className="flex items-center justify-center gap-2 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-xl text-xs font-bold transition-colors">
            <AlertTriangle className="w-4 h-4" /> Reset App
          </button>
        </div>
      </div>

      {savedCharts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white px-1">Saved Charts</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {savedCharts.map(chart => (
              <div key={chart.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">{chart.name || 'Untitled Chart'}</div>
                  <div className="text-[10px] text-zinc-500">{new Date(chart.updatedAt).toLocaleString()} • {chart.chartType}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      // In a real app, this would trigger a global state update to load the chart
                      pwaUi.showToast('Chart loaded (simulation)');
                    }}
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    Load
                  </button>
                  <button 
                    onClick={() => handleDeleteChart(chart.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
