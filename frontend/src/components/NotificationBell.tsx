import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { notificationService, NotificationData } from '../services/notifications';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setIsOpen(false);
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    const iconClasses = 'h-4 w-4';
    switch (type) {
      case 'success':
        return <Check className={`${iconClasses} text-green-500`} />;
      case 'warning':
        return <Bell className={`${iconClasses} text-yellow-500`} />;
      case 'error':
        return <X className={`${iconClasses} text-red-500`} />;
      default:
        return <Bell className={`${iconClasses} text-blue-500`} />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
                title="Limpar todas"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.actionText && (
                        <div className="mt-2">
                          <span className="text-xs text-primary-600 font-medium">
                            {notification.actionText} →
                          </span>
                        </div>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-2 bg-gray-50 text-center">
              <span className="text-xs text-gray-500">
                Mostrando 10 de {notifications.length} notificações
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
