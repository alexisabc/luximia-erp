import api from './core';

export const getNotifications = () => api.get('/notifications/list/');
export const getUnreadCount = () => api.get('/notifications/list/unread_count/');
export const markAsRead = (id) => api.post(`/notifications/list/${id}/mark_as_read/`);
export const markAllAsRead = () => api.post('/notifications/list/mark_all_as_read/');
