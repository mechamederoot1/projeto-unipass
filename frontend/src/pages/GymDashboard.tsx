import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, AlertTriangle, BarChart3, Calendar, Settings, LogOut as LogOutIcon } from 'lucide-react';
import { BarChart, LineChart } from '../components/Charts';
import LoadingSpinner from '../components/LoadingSpinner';

interface GymStats {
  gym: {
    id: number;
    name: string;
    address: string;
    current_occupancy: number;
    max_capacity: number;
    occupancy_percentage: number;
  };
  stats: {
    active_checkins: number;
    today_checkins: number;
    week_checkins: number;
    month_checkins: number;
  };
  hourly_distribution: Array<{hour: number; count: number}>;
  daily_trend: Array<{date: string; checkins: number}>;
}

interface ActiveCheckin {
  id: number;
  user_name: string;
  user_email: string;
  checkin_time: string;
  duration_minutes: number;
}

const GymDashboard: React.FC = () => {
  const [gymStats, setGymStats] = useState<GymStats | null>(null);
  const [activeCheckins, setActiveCheckins] = useState<ActiveCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    loadActiveCheckins();
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadActiveCheckins();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock API call - replace with actual API
      const mockData: GymStats = {
        gym: {
          id: 1,
          name: "Smart Fit Centro",
          address: "Rua das Flores, 123 - Centro",
          current_occupancy: 45,
          max_capacity: 80,
          occupancy_percentage: 56.25
        },
        stats: {
          active_checkins: 45,
          today_checkins: 127,
          week_checkins: 892,
          month_checkins: 3456
        },
        hourly_distribution: [
          {hour: 6, count: 15}, {hour: 7, count: 32}, {hour: 8, count: 28},
          {hour: 9, count: 18}, {hour: 10, count: 22}, {hour: 11, count: 25},
          {hour: 12, count: 35}, {hour: 13, count: 30}, {hour: 14, count: 20},
          {hour: 15, count: 25}, {hour: 16, count: 28}, {hour: 17, count: 35},
          {hour: 18, count: 45}, {hour: 19, count: 50}, {hour: 20, count: 42},
          {hour: 21, count: 25}, {hour: 22, count: 12}
        ],
        daily_trend: [
          {date: '2024-07-31', checkins: 127},
          {date: '2024-07-30', checkins: 145},
          {date: '2024-07-29', checkins: 132},
          {date: '2024-07-28', checkins: 98},
          {date: '2024-07-27', checkins: 156},
          {date: '2024-07-26', checkins: 134},
          {date: '2024-07-25', checkins: 121}
        ]
      };
      
      setGymStats(mockData);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveCheckins = async () => {
    try {
      // Mock API call - replace with actual API
      const mockCheckins: ActiveCheckin[] = [
        {
          id: 1,
          user_name: "João Silva",
          user_email: "joao@email.com",
          checkin_time: new Date(Date.now() - 45 * 60000).toISOString(),
          duration_minutes: 45
        },
        {
          id: 2,
          user_name: "Maria Santos",
          user_email: "maria@email.com",
          checkin_time: new Date(Date.now() - 30 * 60000).toISOString(),
          duration_minutes: 30
        },
        {
          id: 3,
          user_name: "Pedro Costa",
          user_email: "pedro@email.com",
          checkin_time: new Date(Date.now() - 120 * 60000).toISOString(),
          duration_minutes: 120
        }
      ];
      
      setActiveCheckins(mockCheckins);
    } catch (err) {
      console.error('Erro ao carregar check-ins ativos:', err);
    }
  };

  const handleForceCheckout = async (checkinId: number) => {
    if (!window.confirm('Tem certeza que deseja fazer o check-out forçado deste usuário?')) {
      return;
    }

    try {
      // Mock API call - replace with actual API
      setActiveCheckins(prev => prev.filter(c => c.id !== checkinId));
      
      // Update occupancy
      if (gymStats) {
        setGymStats(prev => prev ? {
          ...prev,
          gym: {
            ...prev.gym,
            current_occupancy: prev.gym.current_occupancy - 1,
            occupancy_percentage: ((prev.gym.current_occupancy - 1) / prev.gym.max_capacity) * 100
          }
        } : null);
      }
    } catch (err) {
      setError('Erro ao fazer check-out forçado');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  if (!gymStats) {
    return (
      <div className="min-h-screen-safe bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button onClick={loadDashboardData} className="btn-primary">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - {gymStats.gym.name}
              </h1>
              <p className="text-sm text-gray-600">{gymStats.gym.address}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Ocupação Atual</p>
                <p className="text-lg font-bold text-primary-600">
                  {gymStats.gym.current_occupancy}/{gymStats.gym.max_capacity}
                </p>
              </div>
              <button className="btn-secondary">
                <Settings size={20} className="mr-2" />
                Configurações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Visão Geral', icon: BarChart3 },
              { id: 'active', name: 'Check-ins Ativos', icon: Users },
              { id: 'reports', name: 'Relatórios', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon size={20} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ativos Agora</p>
                    <p className="text-2xl font-bold text-gray-900">{gymStats.stats.active_checkins}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hoje</p>
                    <p className="text-2xl font-bold text-gray-900">{gymStats.stats.today_checkins}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg mr-4">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                    <p className="text-2xl font-bold text-gray-900">{gymStats.stats.week_checkins}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-lg mr-4">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Este Mês</p>
                    <p className="text-2xl font-bold text-gray-900">{gymStats.stats.month_checkins}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Occupancy Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status de Ocupação</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Ocupação atual</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {Math.round(gymStats.gym.occupancy_percentage)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Pessoas na academia</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {gymStats.gym.current_occupancy} de {gymStats.gym.max_capacity}
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${getOccupancyColor(gymStats.gym.occupancy_percentage)}`}
                  style={{ width: `${Math.min(gymStats.gym.occupancy_percentage, 100)}%` }}
                />
              </div>
              
              {gymStats.gym.occupancy_percentage >= 80 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    Academia com alta ocupação. Considere alertar novos usuários.
                  </span>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Horário</h3>
                <BarChart 
                  data={gymStats.hourly_distribution.map(item => ({
                    label: `${item.hour}h`,
                    value: item.count
                  }))}
                  height={200}
                />
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Semanal</h3>
                <LineChart 
                  data={gymStats.daily_trend.map(item => ({
                    x: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
                    y: item.checkins
                  }))}
                  height={200}
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'active' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Check-ins Ativos ({activeCheckins.length})
              </h3>
              <button
                onClick={loadActiveCheckins}
                className="btn-secondary text-sm"
              >
                Atualizar
              </button>
            </div>

            {activeCheckins.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum check-in ativo no momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCheckins.map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{checkin.user_name}</h4>
                        <p className="text-sm text-gray-600">{checkin.user_email}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock size={12} className="mr-1" />
                          <span>
                            Check-in: {new Date(checkin.checkin_time).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <span className="mx-2">•</span>
                          <span>Tempo: {formatDuration(checkin.duration_minutes)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {checkin.duration_minutes > 240 && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Longa permanência
                        </span>
                      )}
                      <button
                        onClick={() => handleForceCheckout(checkin.id)}
                        className="text-red-600 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                      >
                        <LogOutIcon size={16} className="inline mr-1" />
                        Check-out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'reports' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Relatórios</h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="h-8 w-8 text-primary-600 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Relatório de Frequência</h4>
                <p className="text-sm text-gray-600">Análise detalhada de check-ins por período</p>
              </button>
              
              <button className="p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Users className="h-8 w-8 text-primary-600 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Usuários Mais Ativos</h4>
                <p className="text-sm text-gray-600">Ranking de usuários por frequência</p>
              </button>
              
              <button className="p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Clock className="h-8 w-8 text-primary-600 mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">Horários de Pico</h4>
                <p className="text-sm text-gray-600">Análise de ocupação por horário</p>
              </button>
            </div>
            
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Relatórios Personalizados</h4>
              <p className="text-sm text-blue-700 mb-4">
                Gere relatórios customizados com filtros avançados por data, usuário e tipo de atividade.
              </p>
              <button className="btn-primary">
                Gerar Relatório Personalizado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GymDashboard;
