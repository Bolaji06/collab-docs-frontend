
import { apiClient } from './api-client';

export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    intent: 'brainstorm' | 'decision' | 'execute' | 'document';
    content: any;
}

export const templateService = {
    getTemplates: () => apiClient.get<{ success: boolean; data: DocumentTemplate[] }>('/templates'),
    getTemplateById: (id: string) => apiClient.get<{ success: boolean; data: DocumentTemplate }>(`/templates/${id}`)
};
