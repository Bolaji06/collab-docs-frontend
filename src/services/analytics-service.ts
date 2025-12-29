
import { apiClient } from './api-client';

export interface WorkspaceHealth {
    alignmentDebt: number;
    momentumScore: number;
    activeMembers: number;
    documentCount: number;
    trends: { day: string; score: number }[];
}

export const analyticsService = {
    getWorkspaceHealth: (workspaceId: string) =>
        apiClient.get<{ success: boolean; data: WorkspaceHealth }>(`/analytics/${workspaceId}/health`).then(res => res.data)
};
