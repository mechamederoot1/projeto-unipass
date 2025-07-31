import { locationService } from './location';

interface QRCodeData {
  type: 'gym_checkin';
  gymId: number;
  gymName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  validUntil: string;
  signature: string;
}

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  gymId?: number;
  gymName?: string;
  distance?: number;
}

class QRCodeService {
  private readonly MAX_DISTANCE_METERS = 100; // Distância máxima permitida em metros
  private readonly QR_CODE_VALIDITY_HOURS = 24; // QR codes válidos por 24 horas

  /**
   * Valida um QR code e verifica a localização do usuário
   */
  async validateQRCode(qrData: string): Promise<ValidationResult> {
    try {
      // Parse do QR code
      const qrCodeData = this.parseQRCode(qrData);
      if (!qrCodeData) {
        return { isValid: false, errorMessage: 'QR code inválido ou formato não reconhecido' };
      }

      // Validar expiração
      const expiredResult = this.validateExpiration(qrCodeData);
      if (!expiredResult.isValid) {
        return expiredResult;
      }

      // Validar localização
      const locationResult = await this.validateLocation(qrCodeData);
      if (!locationResult.isValid) {
        return locationResult;
      }

      // Validar assinatura (simula��ão - seria implementação real em produção)
      const signatureResult = this.validateSignature(qrCodeData);
      if (!signatureResult.isValid) {
        return signatureResult;
      }

      return {
        isValid: true,
        gymId: qrCodeData.gymId,
        gymName: qrCodeData.gymName,
        distance: locationResult.distance
      };

    } catch (error) {
      console.error('Erro ao validar QR code:', error);
      return { isValid: false, errorMessage: 'Erro interno ao validar QR code' };
    }
  }

  /**
   * Parse do QR code para extrair dados estruturados
   */
  private parseQRCode(qrData: string): QRCodeData | null {
    try {
      // Primeiro tenta parser como JSON
      const parsed = JSON.parse(qrData);
      
      // Valida estrutura básica
      if (parsed.type !== 'gym_checkin' || !parsed.gymId || !parsed.coordinates) {
        return null;
      }

      return parsed as QRCodeData;
    } catch (error) {
      // Se não for JSON, tenta parser formatos alternativos
      return this.parseAlternativeFormats(qrData);
    }
  }

  /**
   * Parse de formatos alternativos de QR code
   */
  private parseAlternativeFormats(qrData: string): QRCodeData | null {
    // Formato URL: unipass://checkin/gymId/lat/lng/signature
    const urlMatch = qrData.match(/unipass:\/\/checkin\/(\d+)\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)\/(.+)/);
    if (urlMatch) {
      const [, gymId, lat, lng, signature] = urlMatch;
      return {
        type: 'gym_checkin',
        gymId: parseInt(gymId),
        gymName: `Academia ${gymId}`, // Em produção, buscar nome real
        coordinates: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        signature
      };
    }

    // Formato simples: GYM_ID:LAT:LNG:TIMESTAMP
    const simpleMatch = qrData.match(/^(\d+):(-?\d+\.?\d*):(-?\d+\.?\d*):(\d+)$/);
    if (simpleMatch) {
      const [, gymId, lat, lng, timestamp] = simpleMatch;
      return {
        type: 'gym_checkin',
        gymId: parseInt(gymId),
        gymName: `Academia ${gymId}`,
        coordinates: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        },
        validUntil: new Date(parseInt(timestamp)).toISOString(),
        signature: 'legacy'
      };
    }

    return null;
  }

  /**
   * Valida se o QR code não expirou
   */
  private validateExpiration(qrCodeData: QRCodeData): ValidationResult {
    const now = new Date();
    const validUntil = new Date(qrCodeData.validUntil);

    if (now > validUntil) {
      return { 
        isValid: false, 
        errorMessage: 'QR code expirado. Solicite um novo QR code na academia.' 
      };
    }

    return { isValid: true };
  }

  /**
   * Valida a localização do usuário em relação à academia
   */
  private async validateLocation(qrCodeData: QRCodeData): Promise<ValidationResult & { distance?: number }> {
    try {
      // Obter localização atual do usuário
      const userLocation = await locationService.getCurrentLocation();
      
      if (!userLocation) {
        return { 
          isValid: false, 
          errorMessage: 'Não foi possível obter sua localização. Ative o GPS e tente novamente.' 
        };
      }

      // Calcular distância
      const distance = locationService.calculateDistance(
        userLocation,
        {
          latitude: qrCodeData.coordinates.latitude,
          longitude: qrCodeData.coordinates.longitude
        }
      ) * 1000; // Convert to meters

      // Verificar se está dentro do raio permitido
      if (distance > this.MAX_DISTANCE_METERS) {
        return {
          isValid: false,
          errorMessage: `Você precisa estar próximo à academia para fazer check-in. Distância atual: ${Math.round(distance)}m (máximo: ${this.MAX_DISTANCE_METERS}m)`,
          distance
        };
      }

      return { isValid: true, distance };

    } catch (error) {
      console.error('Erro ao validar localização:', error);
      return { 
        isValid: false, 
        errorMessage: 'Erro ao verificar localização. Verifique suas permissões de GPS.' 
      };
    }
  }

  /**
   * Valida a assinatura do QR code (implementação simplificada)
   */
  private validateSignature(qrCodeData: QRCodeData): ValidationResult {
    // Em produção, isso seria uma validação cryptográfica real
    // Por ora, aceita qualquer assinatura não vazia
    if (!qrCodeData.signature || qrCodeData.signature.length < 8) {
      return { 
        isValid: false, 
        errorMessage: 'QR code com assinatura inválida. Use apenas QR codes oficiais.' 
      };
    }

    return { isValid: true };
  }

  /**
   * Gera um QR code para uma academia (para uso administrativo)
   */
  generateGymQRCode(gymId: number, gymName: string, latitude: number, longitude: number): string {
    const qrCodeData: QRCodeData = {
      type: 'gym_checkin',
      gymId,
      gymName,
      coordinates: { latitude, longitude },
      validUntil: new Date(Date.now() + this.QR_CODE_VALIDITY_HOURS * 60 * 60 * 1000).toISOString(),
      signature: this.generateSignature(gymId, latitude, longitude)
    };

    return JSON.stringify(qrCodeData);
  }

  /**
   * Gera uma assinatura simples (em produção seria HMAC ou similar)
   */
  private generateSignature(gymId: number, latitude: number, longitude: number): string {
    const data = `${gymId}:${latitude}:${longitude}:${Date.now()}`;
    return btoa(data).substring(0, 16);
  }

  /**
   * Verifica se uma string parece ser um QR code válido
   */
  isValidQRCodeFormat(qrData: string): boolean {
    if (!qrData || qrData.length < 10) return false;

    // Verifica se é JSON válido
    try {
      const parsed = JSON.parse(qrData);
      return parsed.type === 'gym_checkin';
    } catch (error) {
      // Verifica formatos alternativos
      return /^(unipass:\/\/|[\d:.-]+)/.test(qrData);
    }
  }

  /**
   * Obtém informações básicas do QR code sem validação completa
   */
  getQRCodeInfo(qrData: string): { gymId?: number; gymName?: string } | null {
    const parsed = this.parseQRCode(qrData);
    if (!parsed) return null;

    return {
      gymId: parsed.gymId,
      gymName: parsed.gymName
    };
  }

  /**
   * Gera QR codes de exemplo para testes
   */
  generateSampleQRCodes(): Record<string, string> {
    return {
      // Academias originais (São Paulo Capital)
      'Smart Fit Paulista': this.generateGymQRCode(1, 'Smart Fit Paulista', -23.5505, -46.6333),
      'Bio Ritmo Faria Lima': this.generateGymQRCode(2, 'Bio Ritmo Faria Lima', -23.5729, -46.6899),
      'Academia Central': this.generateGymQRCode(3, 'Academia Central', -23.5489, -46.6388),
      'Bodytech Vila Olímpia': this.generateGymQRCode(4, 'Bodytech Vila Olímpia', -23.5955, -46.6814),

      // Academias locais (ABC Paulista)
      'Academia Espírito Santo': this.generateGymQRCode(5, 'Academia Espírito Santo', -23.6181, -46.5564),
      'Fitness Senhor do Bonfim': this.generateGymQRCode(6, 'Fitness Senhor do Bonfim', -23.6675, -46.4611),
      'PowerGym Santo André': this.generateGymQRCode(7, 'PowerGym Santo André', -23.6739, -46.5391),
      'Fit Center ABC': this.generateGymQRCode(8, 'Fit Center ABC', -23.6089, -46.5477)
    };
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;
