
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
        const response = await apiClient.get<Notification[]>('/notifications');
        return response;
    },

    markAsRead: async (id: string) => {
        const response = await apiClient.put<Notification>(`/notifications/${id}/read`, {});
        return response;
    },

    markAllAsRead: async () => {
        const response = await apiClient.put<{ message: string }>('/notifications/read-all', {});
        return response;
    },

    sendNudge: async (data: { userIds: string[]; documentId: string; documentTitle: string }) => {
        const response = await apiClient.post<{ message: string }>('/notifications/send-nudge', data);
        return response;
    }
};
