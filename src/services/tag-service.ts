import { apiClient } from './api-client';

export interface Tag {
    id: string;
    name: string;
    color: string | null;
    userId: string;
}

export const tagService = {
    getAll: async (): Promise<Tag[]> => {
        const response = await apiClient.get<Tag[]>('/tags');
        return response;
    },

    getById: async (id: string): Promise<Tag> => {
        const response = await apiClient.get<Tag>(`/tags/${id}`);
        return response;
    },

    create: async (name: string, color?: string): Promise<Tag> => {
        const response = await apiClient.post<Tag>('/tags', { name, color });
        return response;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/tags/${id}`);
    },

    addToDocument: async (documentId: string, tagId: string): Promise<void> => {
        await apiClient.post(`/tags/${tagId}/documents/${documentId}`, {});
    },

    removeFromDocument: async (documentId: string, tagId: string): Promise<void> => {
        await apiClient.delete(`/tags/${tagId}/documents/${documentId}`);
    }
};
