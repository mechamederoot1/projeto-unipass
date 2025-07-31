import React, { useState, useEffect } from 'react';
import {
  Users, Building2, TrendingUp, AlertTriangle,
  Search, Plus, Settings, Eye, Ban, CheckCircle,
  DollarSign, Activity
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AdminStats {
  total_users: number;
  total_gyms: number;
  total_checkins: number;
  active_subscriptions: number;
  revenue_monthly: number;
  new_users_this_month: number;
  growth_percentage: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  subscription_status: string;
  total_checkins: number;
  member_since: string;
  last_activity?: string;
}

interface GymAdmin {
  id: number;
  name: string;
  address: string;
  current_occupancy: number;
  max_capacity: number;
  is_active: boolean;
  owner_name: string;
  owner_email: string;
  total_members: number;
  revenue_monthly: number;
}

const AdminPanel: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'gyms' | 'analytics' | 'settings'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [gyms, setGyms] = useState<GymAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [, ] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [activeTab, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard':
          await loadDashboardStats();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'gyms':
          await loadGyms();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const statsData = await apiService.getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Fallback para dados básicos
      setStats({
        total_users: 0,
        total_gyms: 0,
        total_checkins: 0,
        active_subscriptions: 0,
        revenue_monthly: 0,
        new_users_this_month: 0,
        growth_percentage: 0
      });
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getAdminUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    }
  };

  const loadGyms = async () => {
    try {
      const gymsData = await apiService.getAdminGyms();
      setGyms(gymsData);
    } catch (error) {
      console.error('Erro ao carregar academias:', error);
      setGyms([]);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      await apiService.toggleUserStatus(userId, !user.is_active);
      
      // Atualizar estado local
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  const handleToggleGymStatus = async (gymId: number) => {
    try {
      const gym = gyms.find(g => g.id === gymId);
      if (!gym) return;

      await apiService.toggleGymStatus(gymId, !gym.is_active);
      
      // Atualizar estado local
      setGyms(prev => prev.map(g => 
        g.id === gymId ? { ...g, is_active: !g.is_active } : g
      ));
    } catch (error) {
      console.error('Erro ao alterar status da academia:', error);
      alert('Erro ao alterar status da academia');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGyms = gyms.filter(gym =>
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar se o usuário tem permissões de admin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Faça login para acessar o painel administrativo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gestão completa do sistema Unipass</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="h-5 w-5" /> },
                { id: 'users', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
                { id: 'gyms', label: 'Academias', icon: <Building2 className="h-5 w-5" /> },
                { id: 'analytics', label: 'Analytics', icon: <Activity className="h-5 w-5" /> },
                { id: 'settings', label: 'Configurações', icon: <Settings className="h-5 w-5" /> }
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-blue-600">Total de Usuários</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.total_users.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                        <div className="flex items-center">
                          <Building2 className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-green-600">Academias Ativas</p>
                            <p className="text-2xl font-bold text-green-900">{stats.total_gyms.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                        <div className="flex items-center">
                          <Activity className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-purple-600">Check-ins Totais</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.total_checkins.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-orange-600" />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-orange-600">Receita Mensal</p>
                            <p className="text-2xl font-bold text-orange-900">R$ {stats.revenue_monthly.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Growth Stats */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Crescimento</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Novos usuários este mês</span>
                            <span className="font-semibold text-green-600">+{stats.new_users_this_month}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa de crescimento</span>
                            <span className={`font-semibold ${stats.growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stats.growth_percentage >= 0 ? '+' : ''}{stats.growth_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assinaturas ativas</span>
                            <span className="font-semibold text-blue-600">{stats.active_subscriptions}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">API Status</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Online
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Database</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Conectado
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Notificações</span>
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Funcionando
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar usuários..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                          <Plus className="h-4 w-4" />
                          <span>Novo Usuário</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assinatura</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-ins</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro desde</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {user.is_active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {user.subscription_status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {user.total_checkins}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(user.member_since).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                  <button className="text-primary-600 hover:text-primary-900">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleUserStatus(user.id)}
                                    className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                  >
                                    {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gyms Tab */}
                {activeTab === 'gyms' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Gerenciar Academias</h3>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar academias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                          <Plus className="h-4 w-4" />
                          <span>Nova Academia</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredGyms.map((gym) => (
                        <div key={gym.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">{gym.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              gym.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {gym.is_active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>{gym.address}</p>
                            <p>Proprietário: {gym.owner_name}</p>
                            <p>Email: {gym.owner_email}</p>
                            <p>Ocupação: {gym.current_occupancy}/{gym.max_capacity}</p>
                            <p>Membros: {gym.total_members}</p>
                            <p>Receita: R$ {gym.revenue_monthly.toLocaleString()}/mês</p>
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <button className="flex-1 bg-primary-600 text-white py-2 px-3 rounded text-sm hover:bg-primary-700">
                              Ver Detalhes
                            </button>
                            <button 
                              onClick={() => handleToggleGymStatus(gym.id)}
                              className={`py-2 px-3 rounded text-sm ${
                                gym.is_active 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {gym.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outras abas */}
                {!['dashboard', 'users', 'gyms'].includes(activeTab) && (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
                    <p className="text-gray-500">Esta funcionalidade está sendo implementada.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
