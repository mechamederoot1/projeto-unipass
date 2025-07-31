import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { pwaService } from '../services/pwa';

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app can be installed
    const checkInstallability = () => {
      setIsInstalled(pwaService.isAppInstalled());
      setShowPrompt(pwaService.canInstall());
    };

    checkInstallability();

    // Listen for install events
    const handleBeforeInstallPrompt = () => {
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await pwaService.showInstallPrompt();
    if (installed) {
      setShowPrompt(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 24 hours
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt || isInstalled) {
    return null;
  }

  const instructions = pwaService.getInstallInstructions();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-primary-100 text-primary-600 p-2 rounded-lg mr-3">
              {instructions.platform === 'Desktop' ? (
                <Monitor size={20} />
              ) : (
                <Smartphone size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Instalar Unipass
              </h3>
              <p className="text-xs text-gray-600">
                Acesso rápido na tela inicial
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Instale o app para:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Acesso offline</li>
            <li>• Notificações push</li>
            <li>• Experiência nativa</li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors duration-200"
          >
            Agora não
          </button>
        </div>

        {/* Manual install instructions for iOS */}
        {instructions.platform === 'iOS' && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Para instalar:</p>
            <ol className="text-xs text-gray-500 space-y-1">
              {instructions.instructions.map((instruction, index) => (
                <li key={index}>{index + 1}. {instruction}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;
