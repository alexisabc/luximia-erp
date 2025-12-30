'use client';

import { useRef, useEffect } from 'react';
import { Bell, CheckCheck, Inbox, Info, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';

export default function NotificationsBell() {
    const {
        unreadCount,
        notifications,
        isOpen,
        setIsOpen,
        toggleOpen,
        loading,
        markRead
    } = useNotifications();

    const menuRef = useRef(null);
    const router = useRouter();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsOpen]);

    const handleNotificationClick = (notification) => {
        if (!notification.leida) {
            markRead(notification.id);
        }

        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'ERROR': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Hace un momento';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95 z-50 overflow-hidden max-w-[90vw] sm:max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markRead('all')}
                                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg"
                            >
                                <CheckCheck className="h-3 w-3" />
                                Marcar todo leído
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                        {loading && notifications.length === 0 ? (
                            <div className="flex justify-center p-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                    <Inbox className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium">Bandeja vacía</p>
                                <p className="text-xs">No tienes notificaciones nuevas</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`group flex gap-3 p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${!notif.leida ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif.tipo)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm ${!notif.leida ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                                    {notif.titulo}
                                                </p>
                                                {!notif.leida && (
                                                    <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                {notif.mensaje}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {formatTime(notif.fecha_creacion)}
                                                </span>
                                                {notif.link && (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-blue-500 font-medium group-hover:underline">
                                                        Ver detalle <ExternalLink className="h-2.5 w-2.5" />
                                                    </span>
                                                )}
                                            </div>
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
