
import { apiClient } from "./api-client";

export interface Notification {
    id: string;
    userId: string;
    type: 'COMMENT' | 'SHARE' | 'SYSTEM';
    title: string;
    message: string;
    documentId?: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getAll: async () => {
        return apiClient.get<Notification[]>('/notifications');
    },

    markAsRead: async (id: string) => {
        return apiClient.put<Notification>(`/notifications/${id}/read`, {});
    },

    markAllAsRead: async () => {
        return apiClient.put<{ message: string }>('/notifications/read-all', {});
    }
};
