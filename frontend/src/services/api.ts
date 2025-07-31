import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await this.client.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  // User endpoints
  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async updateUser(userData: {
    name?: string;
    email?: string;
    phone?: string;
  }) {
    const response = await this.client.put('/users/me', userData);
    return response.data;
  }

  async getUserStats() {
    const response = await this.client.get('/users/me/stats');
    return response.data;
  }

  async getUserCheckins(limit = 50) {
    const response = await this.client.get(`/users/me/checkins?limit=${limit}`);
    return response.data;
  }

  // Gym endpoints
  async getGyms(params?: {
    lat?: number;
    lon?: number;
    radius?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/gyms', { params });
    return response.data;
  }

  async searchGyms(query: string, params?: {
    lat?: number;
    lon?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/gyms/search', {
      params: { q: query, ...params }
    });
    return response.data;
  }

  async getGym(id: number) {
    const response = await this.client.get(`/gyms/${id}`);
    return response.data;
  }

  // Check-in endpoints
  async createCheckin(gymId: number) {
    const response = await this.client.post('/checkins', { gym_id: gymId });
    return response.data;
  }

  async checkout(checkinId: number) {
    const response = await this.client.post('/checkins/checkout', {
      checkin_id: checkinId
    });
    return response.data;
  }

  async getActiveCheckin() {
    const response = await this.client.get('/checkins/active');
    return response.data;
  }

  async getCheckins(limit = 50) {
    const response = await this.client.get(`/checkins?limit=${limit}`);
    return response.data;
  }

  // Subscription methods
  async getSubscriptionPlans() {
    const response = await this.client.get('/subscriptions/plans');
    return response.data;
  }

  async getCurrentSubscription() {
    const response = await this.client.get('/subscriptions/current');
    return response.data;
  }

  async createSubscription(planId: number, billingCycle: string) {
    const response = await this.client.post('/subscriptions', {
      plan_id: planId,
      billing_cycle: billingCycle,
      payment_method: 'card',
      auto_renew: true
    });
    return response.data;
  }

  async cancelSubscription(subscriptionId: number) {
    const response = await this.client.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  }

  // Gamification methods
  async getUserPoints() {
    const response = await this.client.get('/gamification/points');
    return response.data;
  }

  async getUserAchievements() {
    const response = await this.client.get('/gamification/achievements');
    return response.data;
  }

  async getLeaderboard(period: string = 'monthly') {
    const response = await this.client.get(`/gamification/leaderboard?period=${period}`);
    return response.data;
  }

  async getPointHistory() {
    const response = await this.client.get('/gamification/points/history');
    return response.data;
  }

  async getGamificationStats() {
    const response = await this.client.get('/gamification/stats');
    return response.data;
  }

  // Admin methods
  async getAdminStats() {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async getAdminUsers(page: number = 1, limit: number = 20) {
    const response = await this.client.get(`/admin/users?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getAdminGyms(page: number = 1, limit: number = 20) {
    const response = await this.client.get(`/admin/gyms?page=${page}&limit=${limit}`);
    return response.data;
  }

  async toggleUserStatus(userId: number, isActive: boolean) {
    const response = await this.client.patch(`/admin/users/${userId}/status`, { is_active: isActive });
    return response.data;
  }

  async toggleGymStatus(gymId: number, isActive: boolean) {
    const response = await this.client.patch(`/admin/gyms/${gymId}/status`, { is_active: isActive });
    return response.data;
  }

  // Gym Admin methods
  async getGymDashboardStats(gymId: number) {
    const response = await this.client.get(`/gym-admin/${gymId}/stats`);
    return response.data;
  }

  async getActiveCheckinsForGym(gymId: number) {
    const response = await this.client.get(`/gym-admin/${gymId}/active-checkins`);
    return response.data;
  }

  async forceCheckout(checkinId: number) {
    const response = await this.client.post(`/gym-admin/checkins/${checkinId}/force-checkout`);
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  clearAuthToken() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const apiService = new ApiService();
export default apiService;
