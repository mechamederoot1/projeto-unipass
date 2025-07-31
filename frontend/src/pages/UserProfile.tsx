import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Clock, Edit3, Award, Activity, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { BarChart, PieChart, LineChart } from '../components/Charts';
import LoadingSpinner from '../components/LoadingSpinner';
import ShareButton from '../components/ShareButton';

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { userStats, checkinHistory, isLoadingStats, refreshStats, refreshCheckins } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    refreshStats();
    refreshCheckins();
  }, [refreshStats, refreshCheckins]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone
      });
    }
  }, [user]);

  const handleSave = async () => {
    setError('');
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Process check-in data for charts
  const processCheckInData = () => {
    if (!checkinHistory.length) return null;

    // Weekly activity (last 7 days)
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayCount = checkinHistory.filter(checkin => {
        const checkinDate = new Date(checkin.checkin_time);
        return checkinDate.toDateString() === date.toDateString();
      }).length;

      return { x: dayName, y: dayCount };
    });

    // Gym frequency
    const gymFrequency: { [key: string]: number } = {};
    checkinHistory.forEach(checkin => {
      const gymName = checkin.gym_name || 'Academia';
      gymFrequency[gymName] = (gymFrequency[gymName] || 0) + 1;
    });

    const gymData = Object.entries(gymFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ label: name, value: count }));

    // Time distribution
    const timeDistribution = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    checkinHistory.forEach(checkin => {
      const hour = new Date(checkin.checkin_time).getHours();
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
      else if (hour >= 18 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
    });

    const timeData = [
      { label: 'Manhã', value: timeDistribution.morning },
      { label: 'Tarde', value: timeDistribution.afternoon },
      { label: 'Noite', value: timeDistribution.evening },
      { label: 'Madrugada', value: timeDistribution.night }
    ];

    return { weeklyData, gymData, timeData };
  };

  const chartData = processCheckInData();

  if (isLoadingStats && !userStats) {
    return <LoadingSpinner message="Carregando perfil..." />;
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="card mb-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center">
                <User size={32} />
              </div>
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-primary-500 focus:outline-none"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                )}
                <p className="text-gray-600">Membro Unipass</p>
                {userStats && (
                  <p className="text-sm text-gray-500">
                    Membro desde {new Date(userStats.member_since).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200"
            >
              <Edit3 size={20} />
              <span>{isEditing ? 'Salvar' : 'Editar'}</span>
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="flex-1 border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-gray-700">{user?.email}</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1 border-b border-gray-300 focus:border-primary-500 focus:outline-none"
                  />
                ) : (
                  <span className="text-gray-700">{user?.phone}</span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {userStats && (
                <div className="flex items-center space-x-3">
                  <Target className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    Meta mensal: {Math.ceil(userStats.total_checkins / 3)} check-ins
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="bg-primary-100 text-primary-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Activity size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {userStats?.total_checkins || 0}
            </div>
            <div className="text-sm text-gray-600">Total Check-ins</div>
          </div>

          <div className="card text-center">
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Clock size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {userStats?.total_hours_trained || 0}h
            </div>
            <div className="text-sm text-gray-600">Horas Treinadas</div>
          </div>

          <div className="card text-center">
            <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Award size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {userStats?.unique_gyms_visited || 0}
            </div>
            <div className="text-sm text-gray-600">Academias Visitadas</div>
          </div>

          <div className="card text-center">
            <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {chartData ? Math.round(chartData.weeklyData.reduce((sum, day) => sum + day.y, 0) / 7 * 10) / 10 : 0}
            </div>
            <div className="text-sm text-gray-600">Média Semanal</div>
          </div>
        </div>

        {/* Charts Section */}
        {chartData && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Weekly Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Atividade Semanal
              </h3>
              <LineChart data={chartData.weeklyData} height={150} />
            </div>

            {/* Gym Frequency */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Academias Mais Visitadas
              </h3>
              <BarChart data={chartData.gymData} height={150} />
            </div>

            {/* Time Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Horários de Treino
              </h3>
              <PieChart data={chartData.timeData} size={150} />
            </div>
          </div>
        )}

        {/* Check-in History */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Histórico de Check-ins
          </h2>

          {checkinHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-100 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <p className="text-gray-600 mb-4">Nenhum check-in realizado ainda</p>
              <button
                onClick={() => window.location.href = '/checkin'}
                className="btn-primary"
              >
                Fazer Primeiro Check-in
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {checkinHistory.slice(0, 10).map((checkin) => {
                  const duration = checkin.duration_minutes
                    ? `${Math.floor(checkin.duration_minutes / 60)}h ${checkin.duration_minutes % 60}min`
                    : 'Em andamento';

                  return (
                    <div key={checkin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center">
                          <Activity size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {checkin.gym_name || 'Academia'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{new Date(checkin.checkin_time).toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>{new Date(checkin.checkin_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span>{duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        checkin.is_active
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {checkin.is_active ? 'Ativo' : 'Concluído'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {checkinHistory.length > 10 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => refreshCheckins()}
                    className="btn-secondary"
                  >
                    Ver Mais Histórico ({checkinHistory.length - 10} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/checkin'}
            className="btn-primary"
          >
            Fazer Check-in
          </button>
          <button
            onClick={() => window.location.href = '/checkin'}
            className="btn-secondary"
          >
            Encontrar Academias
          </button>
          <div className="flex justify-center">
            <ShareButton
              title="Meu Perfil Unipass"
              text={`Já fiz ${userStats?.total_checkins || 0} check-ins e treinei ${userStats?.total_hours_trained || 0} horas com o Unipass!`}
              variant="secondary"
              size="lg"
              className="w-full flex items-center justify-center space-x-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
