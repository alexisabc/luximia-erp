import apiClient from './core';

const ENDPOINT = '/notifications/buzon/';

export const getNotifications = async (limit = 10) => {
    return apiClient.get(`${ENDPOINT}?limit=${limit}`);
};

export const getUnreadCount = async () => {
    return apiClient.get(`${ENDPOINT}unread_count/`);
};

export const markAsRead = async (ids) => {
    return apiClient.post(`${ENDPOINT}marcar_leidas/`, { ids });
};
