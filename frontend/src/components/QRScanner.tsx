import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanner = async () => {
    setError('');
    setIsScanning(true);

    try {
      // Check camera permission
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setHasPermission(permission.state === 'granted');

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Wait for video to be ready
        videoRef.current.addEventListener('loadedmetadata', () => {
          initQRScanner();
        });
      }

      setHasPermission(true);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Acesso à câmera negado. Ative nas configurações do navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.');
      } else {
        setError('Erro ao acessar a câmera. Verifique se não está sendo usada por outro aplicativo.');
      }
      setIsScanning(false);
    }
  };

  const initQRScanner = async () => {
    try {
      // Dynamically import QrScanner to avoid SSR issues
      const QrScanner = (await import('qr-scanner' as any)).default;
      
      if (videoRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result: any) => {
            onScan(result.data);
            stopScanner();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        );

        await scannerRef.current.start();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error initializing QR scanner:', err);
      setError('Erro ao inicializar o scanner de QR code.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
  };

  const handleRetry = () => {
    stopScanner();
    startScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Escaneie o QR Code</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full h-full flex items-center justify-center">
          {hasPermission === false ? (
            <div className="bg-white rounded-lg p-6 mx-4 text-center">
              <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CameraOff size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Câmera Não Disponível
              </h3>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Para ativar a câmera:</strong><br />
                  1. Clique no ícone de câmera na barra de endereços<br />
                  2. Selecione "Permitir" para este site<br />
                  3. Recarregue a página
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRetry}
                  className="btn-primary flex-1"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning box */}
                  <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Camera className="text-white mr-2" size={20} />
              <p className="text-white text-sm">
                {isScanning ? 'Posicione o QR code dentro do quadrado' : 'Iniciando câmera...'}
              </p>
            </div>
            
            {error && (
              <div className="bg-red-600 text-white rounded-lg p-2 mb-2">
                <div className="flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <p className="text-gray-300 text-xs">
              Certifique-se de estar próximo à academia para fazer o check-in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
