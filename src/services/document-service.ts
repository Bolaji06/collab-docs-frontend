
import { apiClient } from "./api-client";

export interface Document {
    id: string;
    title: string;
    ownerId: string;
    updatedAt: string;
    createdAt: string;
    owner?: {
        username: string;
        email: string;
    };
    content?: any;
}

export const documentService = {
    getAll: async () => {
        return apiClient.get<Document[]>('/documents');
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
    }
};
