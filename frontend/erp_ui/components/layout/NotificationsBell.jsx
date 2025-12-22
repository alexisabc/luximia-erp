'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/services/notifications';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationsBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.count);
        } catch (error) {
            console.error("Error fetching notification count", error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and polling
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Fetch list when opening menu
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, link) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            // Update global count locally to avoid refetch lag
            setUnreadCount(prev => Math.max(0, prev - 1));

            if (link) {
                setIsOpen(false);
                router.push(link);
            }
        } catch (error) {
            toast.error("No se pudo actualizar la notificación");
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            toast.success("Todas las notificaciones marcadas como leídas");
        } catch (error) {
            toast.error("Error al marcar como leídas");
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            case 'warning': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'error': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                <CheckCheck className="h-3 w-3" />
                                Marcar leídas
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                        {loading ? (
                            <div className="flex justify-center p-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <Inbox className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm">No tienes notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleMarkAsRead(notif.id, notif.link)}
                                        className={`group flex gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!notif.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
