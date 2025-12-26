import { apiClient } from './api-client';

export interface DocumentVersion {
    id: string;
    documentId: string;
    content: any;
    versionNumber: number;
    createdBy: string;
    createdAt: string;
    user: {
        id: string;
        username: string;
        avatar?: string | null;
    };
}

export const versionService = {
    getVersions: async (documentId: string): Promise<DocumentVersion[]> => {
        const response = await apiClient.get<{ success: boolean; data: DocumentVersion[] }>(`/versions/${documentId}`);
        return response.data;
    },

    createSnapshot: async (documentId: string): Promise<DocumentVersion> => {
        const response = await apiClient.post<{ success: boolean; data: DocumentVersion }>(`/versions/${documentId}/snapshot`, {});
        return response.data;
    },

    restoreVersion: async (documentId: string, versionId: string): Promise<any> => {
        const response = await apiClient.post<{ success: boolean; data: any }>(`/versions/${documentId}/restore/${versionId}`, {});
        return response.data;
    }
};

export default versionService;
