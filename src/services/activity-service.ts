import { apiClient } from './api-client';

export interface Activity {
    id: string;
    type: string;
    userId: string;
    documentId?: string;
    folderId?: string;
    workspaceId?: string;
    details?: any;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatar?: string | null;
    };
    document?: {
        id: string;
        title: string;
    };
}

export const activityService = {
    getLatestActivities: async (): Promise<Activity[]> => {
        const response = await apiClient.get<{ success: boolean; data: Activity[] }>('/activities');
        return response.data;
    }
};

export default activityService;
