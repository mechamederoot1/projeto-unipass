export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class LocationService {
  private watchId: number | null = null;
  private currentPosition: LocationCoords | null = null;

  /**
   * Get current user location
   */
  async getCurrentLocation(options?: LocationOptions): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste dispositivo'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: LocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          this.currentPosition = coords;
          resolve(coords);
        },
        (error) => {
          let message = 'Erro ao obter localização';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permissão de localização negada. Ative nas configurações do navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Localização indisponível. Verifique sua conexão e GPS.';
              break;
            case error.TIMEOUT:
              message = 'Tempo esgotado para obter localização. Tente novamente.';
              break;
          }
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch user location changes
   */
  watchLocation(
    onSuccess: (coords: LocationCoords) => void,
    onError: (error: string) => void,
    options?: LocationOptions
  ): void {
    if (!navigator.geolocation) {
      onError('Geolocalização não é suportada neste dispositivo');
      return;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000, // 1 minute
      ...options,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        this.currentPosition = coords;
        onSuccess(coords);
      },
      (error) => {
        let message = 'Erro ao monitorar localização';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível';
            break;
          case error.TIMEOUT:
            message = 'Tempo esgotado para obter localização';
            break;
        }
        onError(message);
      },
      defaultOptions
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    point1: LocationCoords,
    point2: LocationCoords
  ): number {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1Rad = this.toRadians(point1.latitude);
    const lat2Rad = this.toRadians(point2.latitude);
    const deltaLat = this.toRadians(point2.latitude - point1.latitude);
    const deltaLon = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }

  /**
   * Check if location permission is granted
   */
  async checkPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      await this.getCurrentLocation({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get cached location if available
   */
  getCachedLocation(): LocationCoords | null {
    return this.currentPosition;
  }

  /**
   * Load location from localStorage
   */
  loadStoredLocation(): LocationCoords | null {
    try {
      const stored = localStorage.getItem('userLocation');
      if (stored) {
        const location = JSON.parse(stored) as LocationCoords;
        this.currentPosition = location;
        return location;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  /**
   * Store location in localStorage
   */
  storeLocation(coords: LocationCoords): void {
    try {
      localStorage.setItem('userLocation', JSON.stringify(coords));
      this.currentPosition = coords;
    } catch {
      // Ignore storage errors
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
export default locationService;
