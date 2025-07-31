export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];
  private permission: NotificationPermission = 'default';

  constructor() {
    this.loadNotifications();
    this.checkPermission();
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check current permission status
   */
  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(title: string, options: NotificationOptions) {
    if (this.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Add notification to internal list
   */
  addNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'isRead'>): NotificationData {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isRead: false,
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Show browser notification
    this.showBrowserNotification(newNotification.title, {
      body: newNotification.message,
      tag: newNotification.id,
    });

    return newNotification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Remove notification
   */
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener([...this.notifications]);
    });
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications() {
    try {
      localStorage.setItem('unipass_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications() {
    try {
      const saved = localStorage.getItem('unipass_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Check-in reminder notification
   */
  showCheckinReminder(gymName: string) {
    this.addNotification({
      title: 'Lembrete de Check-out',
      message: `Você está há mais de 3 horas na ${gymName}. Não esqueça de fazer o check-out!`,
      type: 'warning',
      actionUrl: '/checkin',
      actionText: 'Fazer Check-out'
    });
  }

  /**
   * Welcome notification for new users
   */
  showWelcomeNotification(userName: string) {
    this.addNotification({
      title: 'Bem-vindo ao Unipass!',
      message: `Olá ${userName}! Sua conta foi criada com sucesso. Explore as academias disponíveis.`,
      type: 'success',
      actionUrl: '/checkin',
      actionText: 'Encontrar Academias'
    });
  }

  /**
   * Check-in success notification
   */
  showCheckinSuccess(gymName: string) {
    this.addNotification({
      title: 'Check-in Realizado!',
      message: `Check-in realizado com sucesso na ${gymName}. Bom treino!`,
      type: 'success'
    });
  }

  /**
   * Gym capacity alert
   */
  showCapacityAlert(gymName: string) {
    this.addNotification({
      title: 'Academia Lotada',
      message: `A ${gymName} está com alta ocupação no momento. Considere outro horário.`,
      type: 'warning',
      actionUrl: '/checkin',
      actionText: 'Ver Outras Academias'
    });
  }

  /**
   * Weekly summary notification
   */
  showWeeklySummary(checkinsCount: number, hoursCount: number) {
    this.addNotification({
      title: 'Resumo Semanal',
      message: `Esta semana você fez ${checkinsCount} check-ins e treinou por ${hoursCount} horas. Parabéns!`,
      type: 'info',
      actionUrl: '/profile',
      actionText: 'Ver Estatísticas'
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
