import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Users, Calendar, Award, TrendingUp, Medal, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';

interface UserPoints {
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  points_to_next_level: number;
  last_checkin_date: string;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  condition_type: string;
  condition_value: number;
  is_earned: boolean;
  earned_at: string | null;
  progress: number;
  progress_percentage: number;
}

interface LeaderboardEntry {
  position: number;
  user_id: number;
  name: string;
  points: number;
  level: number;
  is_current_user: boolean;
}

interface PointHistoryEntry {
  id: number;
  points: number;
  action: string;
  description: string;
  created_at: string;
}

const Gamification: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard' | 'history'>('overview');
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pointHistory, setPointHistory] = useState<PointHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadGamificationData();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGamificationData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserPoints(),
        loadAchievements(),
        loadLeaderboard(),
        loadPointHistory()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados de gamificação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPoints = async () => {
    try {
      const points = await apiService.getUserPoints();
      setUserPoints(points);
    } catch (error) {
      console.error('Erro ao carregar pontos:', error);
      // Fallback para dados básicos
      setUserPoints({
        total_points: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        points_to_next_level: 100,
        last_checkin_date: new Date().toISOString()
      });
    }
  };

  const loadAchievements = async () => {
    try {
      const achievements = await apiService.getUserAchievements();
      setAchievements(achievements.unlocked || []);
    } catch (error) {
      console.error('Erro ao carregar conquistas:', error);
      setAchievements([]);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboard = await apiService.getLeaderboard('monthly');
      setLeaderboard(leaderboard.monthly || []);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
      setLeaderboard([]);
    }
  };

  const loadPointHistory = async () => {
    try {
      const history = await apiService.getPointHistory();
      setPointHistory(history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setPointHistory([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      'first-checkin': <Award className="h-6 w-6" />,
      'streak-7': <Zap className="h-6 w-6" />,
      'explorer': <Target className="h-6 w-6" />,
      'marathon': <Trophy className="h-6 w-6" />,
      'dedication': <Crown className="h-6 w-6" />
    };
    return icons[iconName as keyof typeof icons] || <Medal className="h-6 w-6" />;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Faça login para ver sua gamificação</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gamificação</h1>
          <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
        </div>

        {/* User Stats Overview */}
        {userPoints && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Pontos</p>
                  <p className="text-2xl font-bold text-primary-600">{userPoints.total_points.toLocaleString()}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nível</p>
                  <p className="text-2xl font-bold text-primary-600">{userPoints.level}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sequência Atual</p>
                  <p className="text-2xl font-bold text-orange-600">{userPoints.current_streak} dias</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Próximo Nível</p>
                  <p className="text-2xl font-bold text-green-600">{userPoints.points_to_next_level}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Visão Geral', icon: <TrendingUp className="h-5 w-5" /> },
                { id: 'achievements', label: 'Conquistas', icon: <Award className="h-5 w-5" /> },
                { id: 'leaderboard', label: 'Ranking', icon: <Trophy className="h-5 w-5" /> },
                { id: 'history', label: 'Histórico', icon: <Calendar className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && userPoints && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-primary-900 mb-4">Progresso do Nível</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Nível {userPoints.level}</span>
                        <span>Nível {userPoints.level + 1}</span>
                      </div>
                      <div className="w-full bg-primary-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.max(10, 100 - (userPoints.points_to_next_level / 100) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-primary-700 text-center">
                        {userPoints.points_to_next_level} pontos para o próximo nível
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4">Sequência</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-orange-600 mb-2">{userPoints.current_streak}</div>
                      <p className="text-orange-700">dias consecutivos</p>
                      <p className="text-sm text-orange-600 mt-2">
                        Recorde: {userPoints.longest_streak} dias
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Suas Conquistas</h3>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          achievement.is_earned
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`rounded-full p-2 ${
                            achievement.is_earned ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {getAchievementIcon(achievement.icon)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-primary-600">
                                +{achievement.points_reward} pontos
                              </span>
                              {achievement.is_earned ? (
                                <span className="text-xs text-green-600">✓ Conquistado</span>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  {achievement.progress_percentage}% completo
                                </span>
                              )}
                            </div>
                            {!achievement.is_earned && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${achievement.progress_percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma conquista ainda. Comece fazendo check-ins!</p>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Ranking Mensal</h3>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          entry.is_current_user
                            ? 'bg-primary-50 border-2 border-primary-200'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            entry.position === 1 ? 'bg-yellow-100 text-yellow-600' :
                            entry.position === 2 ? 'bg-gray-100 text-gray-600' :
                            entry.position === 3 ? 'bg-orange-100 text-orange-600' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {entry.position === 1 && <Crown className="h-4 w-4" />}
                            {entry.position === 2 && <Medal className="h-4 w-4" />}
                            {entry.position === 3 && <Award className="h-4 w-4" />}
                            {entry.position > 3 && <span className="text-sm font-medium">{entry.position}</span>}
                          </div>
                          <div>
                            <p className={`font-medium ${entry.is_current_user ? 'text-primary-900' : 'text-gray-900'}`}>
                              {entry.name}
                              {entry.is_current_user && <span className="text-primary-600 ml-2">(Você)</span>}
                            </p>
                            <p className="text-sm text-gray-500">Nível {entry.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{entry.points.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">pontos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Ranking ainda não disponível</p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Histórico de Pontos</h3>
                {pointHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            entry.points > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{entry.description}</p>
                            <p className="text-sm text-gray-500">{formatDate(entry.created_at)}</p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          entry.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.points > 0 ? '+' : ''}{entry.points}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma atividade registrada ainda</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
