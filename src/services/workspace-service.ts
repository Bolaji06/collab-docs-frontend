import { apiClient } from './api-client';

export interface WorkspaceMember {
    id: string;
    workspaceId: string;
    userId: string;
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    user: {
        id: string;
        username: string;
        avatar: string | null;
        email: string;
    };
}

export interface Workspace {
    id: string;
    name: string;
    ownerId: string;
    isPremium: boolean;
    createdAt: string;
    updatedAt: string;
    members?: WorkspaceMember[];
    _count?: {
        documents: number;
        folders: number;
        members: number;
    };
}

class WorkspaceService {
    async getWorkspaces() {
        const response = await apiClient.get<{ success: boolean; data: Workspace[] }>('/workspaces');
        return response.data;
    }

    async getWorkspaceById(workspaceId: string) {
        const response = await apiClient.get<{ success: boolean; data: Workspace }>(`/workspaces/${workspaceId}`);
        return response.data;
    }

    async createWorkspace(name: string) {
        const response = await apiClient.post<{ success: boolean; data: Workspace }>('/workspaces', { name });
        return response.data;
    }

    async updateWorkspace(workspaceId: string, name: string) {
        const response = await apiClient.patch<{ success: boolean; data: Workspace }>(`/workspaces/${workspaceId}`, { name });
        return response.data;
    }

    async deleteWorkspace(workspaceId: string) {
        await apiClient.delete(`/workspaces/${workspaceId}`);
    }

    async addMember(workspaceId: string, email: string, role: string = 'MEMBER') {
        const response = await apiClient.post<{ success: boolean; data: WorkspaceMember }>(
            `/workspaces/${workspaceId}/members`,
            { email, role }
        );
        return response.data;
    }

    async removeMember(workspaceId: string, memberId: string) {
        await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    }

    async updateMemberRole(workspaceId: string, memberId: string, role: 'ADMIN' | 'MEMBER') {
        const response = await apiClient.patch<{ success: boolean; data: WorkspaceMember }>(
            `/workspaces/${workspaceId}/members/${memberId}`,
            { role }
        );
        return response.data;
    }
}

export const workspaceService = new WorkspaceService();
