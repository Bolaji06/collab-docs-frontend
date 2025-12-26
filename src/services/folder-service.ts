import { apiClient } from './api-client';

export interface Folder {
    id: string;
    name: string;
    color?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        documents: number;
    };
}

export const folderService = {
    getAll: async (workspaceId?: string): Promise<Folder[]> => {
        const response = await apiClient.get<Folder[]>(`/folders${workspaceId ? `?workspaceId=${workspaceId}` : ''}`);
        return response;
    },

    getById: async (id: string): Promise<Folder> => {
        const response = await apiClient.get<Folder>(`/folders/${id}`);
        return response;
    },

    create: async (name: string, color?: string, workspaceId?: string): Promise<Folder> => {
        const response = await apiClient.post<Folder>('/folders', { name, color, workspaceId });
        return response;
    },

    update: async (id: string, name: string, color?: string): Promise<Folder> => {
        const response = await apiClient.put<Folder>(`/folders/${id}`, { name, color });
        return response;
    },

    delete: async (id: string, deleteDocuments: boolean = false): Promise<void> => {
        await apiClient.delete(`/folders/${id}${deleteDocuments ? '?deleteDocuments=true' : ''}`);
    }
};
