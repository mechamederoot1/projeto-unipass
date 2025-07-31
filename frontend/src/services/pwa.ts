class PWAService {
  private deferredPrompt: any = null;
  private isInstalled = false;
  private isInstallable = false;

  constructor() {
    this.init();
  }

  private init() {
    // Check if already installed
    this.checkInstallStatus();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
      console.log('PWA: Install prompt ready');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed');
      this.isInstalled = true;
      this.isInstallable = false;
      this.deferredPrompt = null;
    });

    // Register service worker
    this.registerServiceWorker();
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered', registration);

        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New version available');
                this.showUpdateAvailable();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
      }
    }
  }

  /**
   * Check if app is installed
   */
  private checkInstallStatus() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return;
    }

    // Check if running as PWA
    if (navigator.userAgent.includes('PWA')) {
      this.isInstalled = true;
      return;
    }

    // Check for iOS Safari
    if ((window.navigator as any).standalone) {
      this.isInstalled = true;
      return;
    }
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('PWA: User choice', outcome);
      
      if (outcome === 'accepted') {
        this.isInstalled = true;
        this.isInstallable = false;
      }
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Install prompt failed', error);
      return false;
    }
  }

  /**
   * Show update available notification
   */
  private showUpdateAvailable() {
    // You could integrate this with your notification system
    if (window.confirm('Nova versão disponível! Deseja atualizar?')) {
      window.location.reload();
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.isInstallable && !this.isInstalled;
  }

  /**
   * Check if app is installed
   */
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Get install instructions for different platforms
   */
  getInstallInstructions(): { platform: string; instructions: string[] } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return {
        platform: 'Android',
        instructions: [
          'Toque no menu do navegador (3 pontos)',
          'Selecione "Adicionar à tela inicial"',
          'Confirme a instalação'
        ]
      };
    }
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS',
        instructions: [
          'Toque no botão de compartilhar (□↗)',
          'Selecione "Adicionar à Tela de Início"',
          'Confirme a instalação'
        ]
      };
    }
    
    return {
      platform: 'Desktop',
      instructions: [
        'Clique no ícone de instalação na barra de endereços',
        'Ou use o menu do navegador',
        'Selecione "Instalar Unipass"'
      ]
    };
  }

  /**
   * Share content (Web Share API)
   */
  async shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title || 'Unipass',
          text: data.text || 'Acesse mais de 1000 academias com o Unipass!',
          url: data.url || window.location.href
        });
        return true;
      } catch (error) {
        console.error('PWA: Share failed', error);
      }
    }
    return false;
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const persistent = await navigator.storage.persist();
        console.log('PWA: Persistent storage', persistent);
        return persistent;
      } catch (error) {
        console.error('PWA: Persistent storage failed', error);
      }
    }
    return false;
  }

  /**
   * Add to queue for background sync
   */
  async addToBackgroundSync(tag: string, data: any): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        
        // Store data for background sync
        const pending = JSON.parse(localStorage.getItem('backgroundSync') || '[]');
        pending.push({ tag, data, timestamp: Date.now() });
        localStorage.setItem('backgroundSync', JSON.stringify(pending));
        
        console.log('PWA: Background sync registered', tag);
      } catch (error) {
        console.error('PWA: Background sync failed', error);
      }
    }
  }

  /**
   * Vibrate device (if supported)
   */
  vibrate(pattern: number | number[] = 200): boolean {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
      return true;
    }
    return false;
  }

  /**
   * Show system notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100],
          ...options
        });
        return true;
      } catch (error) {
        console.error('PWA: Notification failed', error);
      }
    }
    return false;
  }
}

export const pwaService = new PWAService();
export default pwaService;
