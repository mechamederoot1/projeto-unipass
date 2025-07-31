import { pwaService } from '../services/pwa';

export class HapticFeedback {
  /**
   * Light vibration for subtle feedback
   */
  static light() {
    pwaService.vibrate(50);
  }

  /**
   * Medium vibration for button presses
   */
  static medium() {
    pwaService.vibrate(100);
  }

  /**
   * Heavy vibration for important actions
   */
  static heavy() {
    pwaService.vibrate(200);
  }

  /**
   * Success pattern
   */
  static success() {
    pwaService.vibrate([100, 50, 100]);
  }

  /**
   * Error pattern
   */
  static error() {
    pwaService.vibrate([50, 50, 50, 50, 200]);
  }

  /**
   * Warning pattern
   */
  static warning() {
    pwaService.vibrate([100, 100, 100]);
  }

  /**
   * Notification pattern
   */
  static notification() {
    pwaService.vibrate([50, 50, 50]);
  }

  /**
   * Check-in success pattern
   */
  static checkinSuccess() {
    pwaService.vibrate([100, 50, 100, 50, 200]);
  }

  /**
   * Scan success pattern (for QR codes)
   */
  static scanSuccess() {
    pwaService.vibrate([50, 30, 50]);
  }
}

export default HapticFeedback;
