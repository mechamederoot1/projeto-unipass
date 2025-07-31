import React, { useState, useEffect } from 'react';
import { QrCode, MapPin, Clock, Check, AlertCircle, Search, Users, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { locationService } from '../services/location';
import { qrCodeService } from '../services/qrcode';
import LocationPermission from '../components/LocationPermission';
import QRScanner from '../components/QRScanner';
import FavoriteButton from '../components/FavoriteButton';
import RatingStars from '../components/RatingStars';
import HapticFeedback from '../utils/haptic';

interface Gym {
  id: number;
  name: string;
  address: string;
  distance?: number;
  rating: number;
  is_open_now: boolean;
  current_occupancy: number;
  max_capacity: number;
  occupancy_percentage: number;
}

const CheckInPage: React.FC = () => {
  const { user } = useAuth();
  const {
    gyms,
    activeCheckin,
    createCheckin,
    checkout,
    searchGyms,
    userLocation,

    isLoadingCheckin,
    refreshGyms
  } = useApp();

  const [checkInMethod, setCheckInMethod] = useState<'qr' | 'search'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Gym[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Check for location on component mount
  useEffect(() => {
    const checkLocation = async () => {
      if (!userLocation) {
        const stored = locationService.loadStoredLocation();
        if (!stored) {
          setShowLocationPrompt(true);
        }
      }
    };
    checkLocation();
  }, [userLocation]);

  // Refresh gyms when location changes
  useEffect(() => {
    if (userLocation) {
      refreshGyms();
      setShowLocationPrompt(false);
    }
  }, [userLocation, refreshGyms]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchGyms(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching gyms:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async (gym: Gym) => {
    setError('');
    HapticFeedback.medium();

    try {
      await createCheckin(gym.id);
      HapticFeedback.checkinSuccess();
    } catch (err: any) {
      setError(err.message);
      HapticFeedback.error();
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckin) return;

    setError('');
    HapticFeedback.medium();

    try {
      await checkout(activeCheckin.id);
      HapticFeedback.success();
    } catch (err: any) {
      setError(err.message);
      HapticFeedback.error();
    }
  };

  const handleLocationGranted = (location: { latitude: number; longitude: number }) => {
    setShowLocationPrompt(false);
  };

  const handleQRScan = async (qrData: string) => {
    setError('');
    setShowQRScanner(false);
    HapticFeedback.scanSuccess();
    setIsLoading(true);

    try {
      // Validar QR code com localização completa
      const validationResult = await qrCodeService.validateQRCode(qrData);

      if (!validationResult.isValid) {
        setError(validationResult.errorMessage || 'QR code inválido');
        HapticFeedback.error();
        return;
      }

      // QR code válido - prosseguir com check-in
      console.log(`QR code válido para ${validationResult.gymName} (distância: ${validationResult.distance?.toFixed(0)}m)`);

      // Perform check-in
      await createCheckin(validationResult.gymId!);
      HapticFeedback.checkinSuccess();

      // Mostrar feedback de sucesso com distância
      if (validationResult.distance !== undefined) {
        const successMessage = `Check-in realizado! Você está a ${validationResult.distance.toFixed(0)}m da academia.`;
        console.log(successMessage);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar QR Code');
      HapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const openQRScanner = () => {
    setShowQRScanner(true);
  };

  const displayGyms = searchQuery ? searchResults : gyms;

  // Format distance for display
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  if (activeCheckin) {
    return (
      <div className="min-h-screen-safe bg-gradient-to-br from-green-50 to-primary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check-in Realizado!
            </h2>
            <p className="text-gray-600 mb-6">
              Olá {user?.name}, você está treinando na
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {activeCheckin.gym?.name || 'Academia'}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {activeCheckin.gym?.address}
              </p>
              <div className="flex items-center justify-center text-green-600 text-sm">
                <Clock size={16} className="mr-1" />
                <span>Check-in às {new Date(activeCheckin.checkin_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Aproveite seu treino! Lembre-se de fazer o check-out ao sair.
            </p>
            <button
              onClick={handleCheckOut}
              disabled={isLoadingCheckin}
              className="btn-secondary w-full mb-4"
            >
              {isLoadingCheckin ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Fazendo check-out...
                </div>
              ) : (
                'Fazer Check-out'
              )}
            </button>
            <p className="text-xs text-gray-500">
              O check-out será automático após 4 horas
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show location prompt if needed
  if (showLocationPrompt) {
    return (
      <div className="min-h-screen-safe bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-8">
          <LocationPermission
            onLocationGranted={handleLocationGranted}
            onLocationDenied={() => setShowLocationPrompt(false)}
          />
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowLocationPrompt(false)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Pular por agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Check-in na Academia
          </h1>
          <p className="text-gray-600">
            Escolha como fazer seu check-in
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center max-w-md mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Method Selection */}
        <div className="flex bg-white rounded-lg p-1 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setCheckInMethod('qr')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              checkInMethod === 'qr'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            <QrCode size={20} className="inline mr-2" />
            QR Code
          </button>
          <button
            onClick={() => setCheckInMethod('search')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              checkInMethod === 'search'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-primary-600'
            }`}
          >
            <Search size={20} className="inline mr-2" />
            Buscar
          </button>
        </div>

        {checkInMethod === 'qr' ? (
          <div className="card text-center max-w-md mx-auto">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <QrCode size={80} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Aponte a câmera para o QR code da academia
              </p>
              <button
                onClick={openQRScanner}
                className="btn-primary"
              >
                <QrCode size={20} className="mr-2" />
                Abrir Scanner
              </button>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <AlertCircle size={16} className="mr-2" />
              <span>Certifique-se de estar na academia para usar o QR code</span>
            </div>

            {/* Sample QR Codes for Testing */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">QR Codes de Teste:</h4>
              <div className="space-y-2">
                {Object.entries(qrCodeService.generateSampleQRCodes()).map(([gymName, qrCode]) => (
                  <button
                    key={gymName}
                    onClick={() => handleQRScan(qrCode)}
                    className="w-full text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-800 transition-colors"
                  >
                    {gymName}
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Use estes QR codes para testar o sistema
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="input-field pl-10"
                  placeholder="Buscar academia..."
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Gyms */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                {searchQuery ? 'Resultados da Busca' : 'Academias Próximas'}
              </h2>

              {!userLocation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-800">
                        Ative a localização para ver academias ordenadas por proximidade
                      </p>
                      <button
                        onClick={() => setShowLocationPrompt(true)}
                        className="text-yellow-700 underline text-sm mt-1"
                      >
                        Ativar localização
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 max-w-2xl mx-auto">
                {displayGyms.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-gray-500">
                      {searchQuery ? 'Nenhuma academia encontrada para sua busca' : 'Nenhuma academia disponível'}
                    </p>
                  </div>
                ) : (
                  displayGyms.map((gym) => (
                    <div key={gym.id} className="card hover:shadow-lg transition-shadow duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {gym.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <RatingStars rating={gym.rating} size="sm" showValue />
                              <FavoriteButton gymId={gym.id} size="sm" />
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin size={16} className="mr-1" />
                            <span>{gym.address}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm mb-3">
                            {formatDistance(gym.distance) && (
                              <span className="text-gray-500">{formatDistance(gym.distance)}</span>
                            )}
                            <div className="flex items-center">
                              <Users size={16} className="mr-1 text-gray-400" />
                              <span className="text-gray-500">
                                {gym.current_occupancy}/{gym.max_capacity} ({Math.round(gym.occupancy_percentage)}%)
                              </span>
                            </div>
                          </div>

                          {/* Occupancy bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                gym.occupancy_percentage > 80 ? 'bg-red-500' :
                                gym.occupancy_percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(gym.occupancy_percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end">
                          <div className={`text-xs px-2 py-1 rounded-full mb-3 ${
                            gym.is_open_now
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {gym.is_open_now ? 'Aberta' : 'Fechada'}
                          </div>

                          <button
                            onClick={() => handleCheckIn(gym)}
                            disabled={!gym.is_open_now || isLoadingCheckin || gym.current_occupancy >= gym.max_capacity}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 min-w-[100px] ${
                              gym.is_open_now && gym.current_occupancy < gym.max_capacity && !isLoadingCheckin
                                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isLoadingCheckin ? (
                              <Loader className="animate-spin h-4 w-4 mx-auto" />
                            ) : !gym.is_open_now ? (
                              'Fechada'
                            ) : gym.current_occupancy >= gym.max_capacity ? (
                              'Lotada'
                            ) : (
                              'Check-in'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />

        {/* Loading overlay when processing QR code */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader className="animate-spin h-6 w-6 text-primary-600" />
              <span className="text-gray-900">Processando QR code...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
