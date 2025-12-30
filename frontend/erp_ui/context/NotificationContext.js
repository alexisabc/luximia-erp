'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount, getNotifications, markAsRead } from '@/services/notifications.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await getUnreadCount();
            if (data.count > unreadCount) {
                // Play sound if count increased and we have a sound file (optional)
                // const audio = new Audio('/sounds/notification.mp3');
                // audio.play().catch(e => console.log('Audio play failed', e));
            }
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    }, [user, unreadCount]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await getNotifications(20); // Get last 20
            setNotifications(data.results || data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Initial fetch and polling
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 60000); // 60s
            return () => clearInterval(interval);
        }
    }, [user, fetchUnreadCount]);

    // Fetch list when dropdown opens
    useEffect(() => {
        if (isOpen && user) {
            fetchNotifications();
        }
    }, [isOpen, user, fetchNotifications]);

    const markRead = async (ids) => {
        try {
            await markAsRead(ids);
            // Optimistic update
            if (ids === 'all') {
                setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
                setUnreadCount(0);
                toast.success('Todas marcadas como leídas');
            } else {
                const idList = Array.isArray(ids) ? ids : [ids];
                setNotifications(prev => prev.map(n => idList.includes(n.id) ? { ...n, leida: true } : n));
                // Recalculate count specifically or fetch again. 
                // Simple approach: decrease count by number of items found that were unread
                // But easier to just fetch count again or approximate.
                fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error marking as read', error);
            toast.error('Error al actualizar notificación');
        }
    };

    const toggleOpen = () => setIsOpen(prev => !prev);

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            notifications,
            isOpen,
            setIsOpen,
            toggleOpen,
            loading,
            refreshNotifications: fetchNotifications,
            markRead,
            loading
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
