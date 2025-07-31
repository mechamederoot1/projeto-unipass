import React, { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { locationService } from '../services/location';

interface LocationPermissionProps {
  onLocationGranted: (location: { latitude: number; longitude: number }) => void;
  onLocationDenied?: () => void;
  showAsCard?: boolean;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationGranted,
  onLocationDenied,
  showAsCard = true
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [error, setError] = useState<string>('');

  const requestLocation = async () => {
    setIsRequesting(true);
    setError('');

    try {
      const location = await locationService.getCurrentLocation();
      locationService.storeLocation(location);
      setPermissionState('granted');
      onLocationGranted(location);
    } catch (err: any) {
      setError(err.message);
      setPermissionState('denied');
      onLocationDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const content = (
    <div className="text-center">
      {permissionState === 'prompt' && (
        <>
          <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Encontrar Academias Próximas
          </h3>
          <p className="text-gray-600 mb-6">
            Permita o acesso à sua localização para encontrar as academias mais próximas de você.
          </p>
          <button
            onClick={requestLocation}
            disabled={isRequesting}
            className="btn-primary w-full"
          >
            {isRequesting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Obtendo localização...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <MapPin size={20} className="mr-2" />
                Permitir Localização
              </div>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Sua localização será usada apenas para encontrar academias próximas
          </p>
        </>
      )}

      {permissionState === 'granted' && (
        <>
          <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Localização Ativada!
          </h3>
          <p className="text-gray-600">
            Agora você pode ver as academias mais próximas de você.
          </p>
        </>
      )}

      {permissionState === 'denied' && (
        <>
          <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Localização Negada
          </h3>
          <p className="text-gray-600 mb-4">
            {error || 'Não foi possível acessar sua localização.'}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Para ativar a localização:</strong><br />
              1. Clique no ícone de localização na barra de endereços<br />
              2. Selecione "Permitir" para este site<br />
              3. Recarregue a página
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="btn-secondary w-full"
          >
            Tentar Novamente
          </button>
        </>
      )}
    </div>
  );

  if (showAsCard) {
    return <div className="card">{content}</div>;
  }

  return content;
};

export default LocationPermission;
