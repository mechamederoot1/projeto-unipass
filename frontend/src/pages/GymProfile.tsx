import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Phone, Users, Wifi, Car, Droplets, Coffee, CheckCircle, MessageSquare } from 'lucide-react';
import { useApp, GymDetails } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import FavoriteButton from '../components/FavoriteButton';
import RatingStars from '../components/RatingStars';
import ReviewModal from '../components/ReviewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareButton from '../components/ShareButton';
import HapticFeedback from '../utils/haptic';



const GymProfile: React.FC = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { getGymDetails, activeCheckin, createCheckin, isLoadingCheckin } = useApp();

  const [gymData, setGymData] = useState<GymDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadGymData();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGymData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await getGymDetails(parseInt(id));
      setGymData(data);
    } catch (err: any) {
      setError('Erro ao carregar dados da academia');
      console.error('Error loading gym data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const amenityIcons: Record<string, React.ReactNode> = {
    'Wifi Grátis': <Wifi size={20} />,
    'Estacionamento': <Car size={20} />,
    'Chuveiros': <Droplets size={20} />,
    'Café': <Coffee size={20} />
  };

  const handleCheckIn = async () => {
    if (!gymData || !isAuthenticated) return;

    setError('');
    HapticFeedback.medium();

    try {
      await createCheckin(gymData.id);
      HapticFeedback.checkinSuccess();
    } catch (err: any) {
      setError(err.message);
      HapticFeedback.error();
    }
  };

  const handleReviewSubmit = async (review: { rating: number; comment: string }) => {
    setShowReviewModal(false);
    HapticFeedback.success();
    // TODO: Implement review submission to backend
    console.log('Review submitted:', review);
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando academia..." />;
  }

  if (error && !gymData) {
    return (
      <div className="min-h-screen-safe bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadGymData}
            className="btn-primary"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!gymData) {
    return (
      <div className="min-h-screen-safe bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Academia não encontrada</p>
        </div>
      </div>
    );
  }

  const occupancyPercentage = (gymData.current_occupancy / gymData.max_capacity) * 100;
  const occupancyColor = occupancyPercentage > 80 ? 'bg-red-500' : occupancyPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Image Gallery */}
        <div className="relative">
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={gymData.images?.[0] || 'https://via.placeholder.com/800x600/e5e7eb/9ca3af?text=Academia'}
              alt={gymData.name}
              className="w-full h-full object-cover"
            />
          </div>

        </div>

        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {gymData.name}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <ShareButton
                      title={`${gymData.name} - Unipass`}
                      text={`Confira a ${gymData.name} no Unipass!`}
                      variant="secondary"
                      size="md"
                    />
                    <FavoriteButton gymId={gymData.id} size="lg" />
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-gray-600 mb-3">
                  <div className="flex items-center">
                    <RatingStars rating={gymData.rating} showValue />
                    <span className="text-sm ml-2">({gymData.total_reviews} avaliações)</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-sm ${
                    gymData.is_open_now ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {gymData.is_open_now ? 'Aberta agora' : 'Fechada'}
                  </div>
                </div>

                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin size={16} className="mr-1" />
                  <span>{gymData.address}</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Check-in Button */}
            <div className="mb-6">
              {activeCheckin ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">Check-in realizado!</p>
                    <p className="text-sm text-green-600">Aproveite seu treino na {gymData.name}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleCheckIn}
                    disabled={!gymData.is_open_now || isLoadingCheckin || gymData.current_occupancy >= gymData.max_capacity || !isAuthenticated}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                      gymData.is_open_now && gymData.current_occupancy < gymData.max_capacity && isAuthenticated && !isLoadingCheckin
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isLoadingCheckin ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Fazendo check-in...
                      </div>
                    ) : !isAuthenticated ? (
                      'Faça login para check-in'
                    ) : !gymData.is_open_now ? (
                      'Academia Fechada'
                    ) : gymData.current_occupancy >= gymData.max_capacity ? (
                      'Academia Lotada'
                    ) : (
                      'Fazer Check-in'
                    )}
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors duration-200 flex items-center justify-center"
                    >
                      <MessageSquare size={20} className="mr-2" />
                      Avaliar Academia
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Hours & Contact */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Horários e Contato
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Seg-Sex:</p>
                    <p className="font-medium">{gymData.open_hours_weekdays}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Sáb-Dom:</p>
                    <p className="font-medium">{gymData.open_hours_weekends}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="font-medium">{gymData.phone}</span>
                </div>
              </div>
            </div>

            {/* Occupancy */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Movimento Atual
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Ocupação atual</span>
                  </div>
                  <span className="font-semibold">{gymData.current_occupancy}/{gymData.max_capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${occupancyColor} transition-all duration-300`}
                    style={{ width: `${occupancyPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {occupancyPercentage < 60 ? 'Academia com movimento tranquilo' :
                   occupancyPercentage < 80 ? 'Academia com movimento moderado' :
                   'Academia com movimento intenso'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sobre a Academia
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {gymData.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comodidades
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gymData.amenities_list.map((amenity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-primary-600">
                    {amenityIcons[amenity] || <CheckCircle size={20} />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {amenity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          gymName={gymData.name}
          onSubmit={handleReviewSubmit}
        />
      </div>
    </div>
  );
};

export default GymProfile;
