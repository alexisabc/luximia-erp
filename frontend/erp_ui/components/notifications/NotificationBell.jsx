'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications/?limit=5');
            const data = await response.json();
            setNotifications(data.results || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`/api/notifications/${notificationId}/mark_read/`, {
                method: 'POST',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            await fetch('/api/notifications/mark_all_read/', {
                method: 'POST',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };
        return icons[type] || 'ℹ';
    };

    const getNotificationColor = (type) => {
        const colors = {
            success: 'text-green-600',
            error: 'text-red-600',
            warning: 'text-yellow-600',
            info: 'text-blue-600',
        };
        return colors[type] || 'text-gray-600';
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
                {unreadCount > 0 ? (
                    <BellSolidIcon className="h-6 w-6 text-blue-600" />
                ) : (
                    <BellIcon className="h-6 w-6" />
                )}

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 z-20 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    disabled={loading}
                                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-500">
                                    No tienes notificaciones
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''
                                            }`}
                                        onClick={() => {
                                            if (!notification.is_read) {
                                                markAsRead(notification.id);
                                            }
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(notification.created_at).toLocaleString('es-MX')}
                                                </p>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notification.is_read && (
                                                <div className="flex-shrink-0">
                                                    <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200">
                            <a
                                href="/notifications"
                                className="block text-center text-sm text-blue-600 hover:text-blue-800"
                                onClick={() => setIsOpen(false)}
                            >
                                Ver todas las notificaciones
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
