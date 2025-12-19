
import { apiClient } from "./api-client";

export interface Document {
    id: string;
    title: string;
    ownerId: string;
    updatedAt: string;
    createdAt: string;
    deletedAt: string | null;
    owner?: {
        username: string;
        email: string;
        avatar?: string | null;
    };
    isPublic: boolean;
    publicRole?: 'VIEWER' | 'EDITOR' | null;
    content?: any;
    permissions?: {
        id: string;
        userId: string;
        role: 'EDITOR' | 'VIEWER';
        user: {
            username: string;
            email: string;
            avatar: string | null;
        };
    }[];
}

export const documentService = {
    getAll: async () => {
        return apiClient.get<Document[]>('/documents');
    },

    getShared: async () => {
        return apiClient.get<Document[]>('/documents/shared');
    },

    getDeleted: async () => {
        return apiClient.get<Document[]>('/documents/trash');
    },

    getById: async (id: string) => {
        return apiClient.get<Document>(`/documents/${id}`);
    },

    create: async (title: string) => {
        return apiClient.post<Document>('/documents', { title });
    },

    update: async (id: string, updates: Partial<Document>) => {
        return apiClient.put<Document>(`/documents/${id}`, updates);
    },

    delete: async (id: string) => {
        return apiClient.delete(`/documents/${id}`);
    },

    restore: async (id: string) => {
        return apiClient.put(`/documents/${id}/restore`, {});
    },

    permanentlyDelete: async (id: string) => {
        return apiClient.delete(`/documents/${id}/permanent`);
    },

    share: async (id: string, email: string, role: 'EDITOR' | 'VIEWER') => {
        return apiClient.post(`/documents/${id}/share`, { email, role });
    },

    removePermission: async (documentId: string, userId: string) => {
        return apiClient.delete(`/documents/${documentId}/share/${userId}`);
    },

    updateAccess: async (documentId: string, isPublic: boolean, publicRole?: 'VIEWER' | 'EDITOR' | null) => {
        return apiClient.put(`/documents/${documentId}/access`, { isPublic, publicRole });
    }
};
