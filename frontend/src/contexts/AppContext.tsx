import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';
import { useAuth } from './AuthContext';

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

export interface GymDetails extends Gym {
  phone: string;
  latitude: number;
  longitude: number;
  open_hours_weekdays: string;
  open_hours_weekends: string;
  amenities_list: string[];
  description: string;
  total_reviews: number;
  images: string[];
}

interface CheckIn {
  id: number;
  user_id: number;
  gym_id: number;
  checkin_time: string;
  checkout_time?: string;
  is_active: boolean;
  duration_minutes?: number;
  gym_name?: string;
  gym_address?: string;
  gym?: {
    name: string;
    address: string;
  };
}

interface UserStats {
  total_checkins: number;
  unique_gyms_visited: number;
  total_hours_trained: number;
  member_since: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface AppContextType {
  // Gym data
  gyms: Gym[];
  favoriteGyms: number[];
  searchGyms: (query: string) => Promise<Gym[]>;
  getGymDetails: (id: number) => Promise<GymDetails>;
  toggleFavorite: (gymId: number) => void;
  
  // Check-in data
  activeCheckin: CheckIn | null;
  checkinHistory: CheckIn[];
  userStats: UserStats | null;
  createCheckin: (gymId: number) => Promise<CheckIn>;
  checkout: (checkinId: number) => Promise<CheckIn>;
  
  // Location
  userLocation: UserLocation | null;
  requestLocation: () => Promise<void>;
  
  // Loading states
  isLoadingGyms: boolean;
  isLoadingCheckin: boolean;
  isLoadingStats: boolean;
  
  // Refresh functions
  refreshGyms: () => Promise<void>;
  refreshCheckins: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Gym state
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [favoriteGyms, setFavoriteGyms] = useState<number[]>([]);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  
  // Check-in state
  const [activeCheckin, setActiveCheckin] = useState<CheckIn | null>(null);
  const [checkinHistory, setCheckinHistory] = useState<CheckIn[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingCheckin, setIsLoadingCheckin] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favoriteGyms');
    if (saved) {
      setFavoriteGyms(JSON.parse(saved));
    }
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshGyms();
      refreshCheckins();
      refreshStats();
      checkActiveCheckin();

      // Request notification permission
      notificationService.requestPermission();

      // Show welcome notification for new users
      if (user?.created_at) {
        const createdDate = new Date(user.created_at);
        const now = new Date();
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

        // Show welcome notification if user registered in the last day
        if (daysDiff < 1) {
          setTimeout(() => {
            notificationService.showWelcomeNotification(user.name);
          }, 2000);
        }
      }
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshGyms = async () => {
    setIsLoadingGyms(true);
    try {
      const params = userLocation 
        ? { lat: userLocation.latitude, lon: userLocation.longitude }
        : undefined;
      const gymData = await apiService.getGyms(params);
      setGyms(gymData);
    } catch (error) {
      console.error('Error loading gyms:', error);
    } finally {
      setIsLoadingGyms(false);
    }
  };

  const searchGyms = async (query: string): Promise<Gym[]> => {
    try {
      const params = userLocation 
        ? { lat: userLocation.latitude, lon: userLocation.longitude }
        : undefined;
      const results = await apiService.searchGyms(query, params);
      return results;
    } catch (error) {
      console.error('Error searching gyms:', error);
      return [];
    }
  };

  const getGymDetails = async (id: number): Promise<GymDetails> => {
    const gymDetails = await apiService.getGym(id);
    return gymDetails;
  };

  const refreshCheckins = async () => {
    if (!isAuthenticated) return;
    
    try {
      const checkins = await apiService.getUserCheckins();
      setCheckinHistory(checkins);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

  const refreshStats = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingStats(true);
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const checkActiveCheckin = async () => {
    if (!isAuthenticated) return;
    
    try {
      const active = await apiService.getActiveCheckin();
      setActiveCheckin(active);
    } catch (error) {
      // No active check-in is normal
      setActiveCheckin(null);
    }
  };

  const createCheckin = async (gymId: number): Promise<CheckIn> => {
    setIsLoadingCheckin(true);
    try {
      const checkin = await apiService.createCheckin(gymId);
      setActiveCheckin(checkin);

      // Find gym name for notification
      const gym = gyms.find(g => g.id === gymId);
      const gymName = gym?.name || 'Academia';

      // Show success notification
      notificationService.showCheckinSuccess(gymName);

      refreshCheckins();
      refreshStats();
      refreshGyms(); // Update occupancy
      return checkin;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Check-in failed');
    } finally {
      setIsLoadingCheckin(false);
    }
  };

  const checkout = async (checkinId: number): Promise<CheckIn> => {
    setIsLoadingCheckin(true);
    try {
      const checkin = await apiService.checkout(checkinId);
      setActiveCheckin(null);
      refreshCheckins();
      refreshStats();
      refreshGyms(); // Update occupancy
      return checkin;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Check-out failed');
    } finally {
      setIsLoadingCheckin(false);
    }
  };

  const toggleFavorite = (gymId: number) => {
    const newFavorites = favoriteGyms.includes(gymId)
      ? favoriteGyms.filter(id => id !== gymId)
      : [...favoriteGyms, gymId];
    
    setFavoriteGyms(newFavorites);
    localStorage.setItem('favoriteGyms', JSON.stringify(newFavorites));
  };

  const requestLocation = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
          resolve();
        },
        (error) => {
          reject(new Error('Location access denied'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  // Load saved location on start
  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      setUserLocation(JSON.parse(saved));
    }
  }, []);

  const value: AppContextType = {
    gyms,
    favoriteGyms,
    searchGyms,
    getGymDetails,
    toggleFavorite,
    activeCheckin,
    checkinHistory,
    userStats,
    createCheckin,
    checkout,
    userLocation,
    requestLocation,
    isLoadingGyms,
    isLoadingCheckin,
    isLoadingStats,
    refreshGyms,
    refreshCheckins,
    refreshStats,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
