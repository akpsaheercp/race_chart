import { swManager } from './ServiceWorkerManager';
import { offlineStorage } from './OfflineStorage';

class PwaUiManager {
  private deferredPrompt: any = null;

  init() {
    this.setupInstallPrompt();
    this.setupUpdateNotification();
    this.setupOfflineIndicator();
    this.checkFirstInstall();
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Check if user dismissed it twice
      const dismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0', 10);
      if (dismissCount >= 2) return;

      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) return;

      // Show after 30 seconds
      setTimeout(() => {
        this.showInstallBanner();
      }, 30000);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('PWA was installed');
      localStorage.setItem('pwa-installed', 'true');
      this.showFirstInstallWelcome();
    });
  }

  private showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-96 bg-zinc-900 border border-indigo-500/50 shadow-2xl rounded-2xl p-5 z-[9999] animate-in slide-in-from-bottom-5 sm:slide-in-from-top-5 duration-500';
    
    const isMobile = /android|iphone|ipad/i.test(navigator.userAgent);
    
    banner.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="p-2 bg-indigo-500/20 rounded-xl">
          <svg class="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-white font-bold mb-1">Install RaceGraph Studio</h3>
          <p class="text-zinc-400 text-sm mb-4">
            ${isMobile ? 'Add to home screen for the best experience — works offline too!' : 'Use as a desktop app for faster access and offline support.'}
          </p>
          <div class="flex gap-3">
            <button id="pwa-install-btn" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors">
              Install App
            </button>
            <button id="pwa-dismiss-btn" class="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Not Now
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (!this.deferredPrompt) return;
      banner.remove();
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.showToast('✅ Installed! Find RaceGraph in your apps');
      }
      this.deferredPrompt = null;
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      banner.remove();
      const count = parseInt(localStorage.getItem('pwa-dismiss-count') || '0', 10);
      localStorage.setItem('pwa-dismiss-count', (count + 1).toString());
    });
  }

  private setupUpdateNotification() {
    window.addEventListener('pwa-update-available', () => {
      if (document.getElementById('pwa-update-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'pwa-update-banner';
      banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-zinc-900 border border-indigo-500/50 shadow-2xl rounded-2xl p-4 z-[9999] animate-in slide-in-from-top-5 duration-500';
      
      banner.innerHTML = `
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-500/20 rounded-full">
              <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 class="text-white font-bold text-sm">Update Available</h3>
              <p class="text-zinc-400 text-xs">A new version is ready.</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button id="pwa-update-later" class="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">Later</button>
            <button id="pwa-update-now" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors">Update</button>
          </div>
        </div>
      `;

      document.body.appendChild(banner);

      document.getElementById('pwa-update-now')?.addEventListener('click', () => {
        banner.innerHTML = '<div class="text-center text-sm text-zinc-400 py-2">Updating...</div>';
        swManager.applyUpdate();
      });

      document.getElementById('pwa-update-later')?.addEventListener('click', () => {
        banner.remove();
      });
    });
  }

  private setupOfflineIndicator() {
    const banner = document.createElement('div');
    banner.id = 'pwa-offline-banner';
    banner.className = 'fixed top-0 left-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold py-1.5 px-4 text-center z-[10000] transform -translate-y-full transition-transform duration-300 flex justify-between items-center';
    banner.innerHTML = `
      <span class="flex-1">📡 You're offline — Chart editing works, AI features need connection</span>
      <button id="pwa-offline-dismiss" class="ml-4 opacity-70 hover:opacity-100">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-offline-dismiss')?.addEventListener('click', () => {
      banner.style.transform = 'translateY(-100%)';
    });

    window.addEventListener('pwa-offline', () => {
      banner.style.transform = 'translateY(0)';
      banner.className = banner.className.replace('bg-green-500 text-white', 'bg-amber-500 text-amber-950');
      banner.querySelector('span')!.innerHTML = '📡 You\'re offline — Chart editing works, AI features need connection';
    });

    window.addEventListener('pwa-online', () => {
      banner.className = banner.className.replace('bg-amber-500 text-amber-950', 'bg-green-500 text-white');
      banner.querySelector('span')!.innerHTML = '✅ Back online';
      setTimeout(() => {
        banner.style.transform = 'translateY(-100%)';
      }, 3000);
    });

    // Initial check
    if (!navigator.onLine) {
      window.dispatchEvent(new CustomEvent('pwa-offline'));
    }
  }

  private checkFirstInstall() {
    // Handled by appinstalled event in setupInstallPrompt
  }

  private showFirstInstallWelcome() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-500';
    
    overlay.innerHTML = `
      <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform scale-95 animate-in zoom-in-95 duration-500 delay-100">
        <div class="w-20 h-20 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 class="text-2xl font-black text-white mb-2">RaceGraph Studio<br/>is now installed!</h2>
        <div class="text-left text-zinc-400 space-y-3 my-8 text-sm">
          <div class="flex items-center gap-3"><span class="text-green-400">✓</span> Works offline</div>
          <div class="flex items-center gap-3"><span class="text-green-400">✓</span> Saves your charts automatically</div>
          <div class="flex items-center gap-3"><span class="text-green-400">✓</span> Fast launch from home screen</div>
          <div class="flex items-center gap-3"><span class="text-green-400">✓</span> Export videos without internet</div>
        </div>
        <button id="pwa-welcome-btn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
          Get Started
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('pwa-welcome-btn')?.addEventListener('click', () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    });
  }

  showStorageWarning(storage: { used: number, quota: number, percent: number }) {
    this.showToast(`⚠ Storage almost full (${Math.round(storage.percent)}% used). Clear old charts to free space.`);
  }

  showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm font-medium py-2 px-4 rounded-full shadow-xl z-[10000] animate-in slide-in-from-bottom-5 duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

export const pwaUi = new PwaUiManager();
