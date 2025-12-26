
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
    folderId?: string | null;
    folder?: {
        id: string;
        name: string;
    };
    tags?: {
        tag: {
            id: string;
            name: string;
            color: string | null;
        }
    }[];
}

export const documentService = {
    getAll: async (options: { search?: string; folderId?: string; tagId?: string; workspaceId?: string } = {}): Promise<Document[]> => {
        const response = await apiClient.get<Document[]>('/documents', {
            params: options
        });
        return response;
    },

    getShared: async () => {
        const response = await apiClient.get<Document[]>('/documents/shared');
        return response;
    },

    getDeleted: async () => {
        const response = await apiClient.get<Document[]>('/documents/trash');
        return response;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<Document>(`/documents/${id}`);
        return response;
    },

    create: async (title: string, folderId?: string | null, workspaceId?: string | null) => {
        const response = await apiClient.post<Document>('/documents', { title, folderId, workspaceId });
        return response;
    },

    update: async (id: string, updates: Partial<Document>) => {
        const response = await apiClient.put<Document>(`/documents/${id}`, updates);
        return response;
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
