
import { apiClient } from "./api-client";

export interface CommentReply {
    id: string;
    commentId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        email: string;
        avatar: string | null;
    };
}

export interface CommentReaction {
    id: string;
    commentId: string;
    userId: string;
    emoji: string;
    user: {
        id: string;
        username: string;
    };
}

export interface Comment {
    id: string;
    documentId: string;
    userId: string;
    content: string;
    positionStart: number;
    positionEnd: number;
    resolved: boolean;
    resolvedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        email: string;
        avatar: string | null;
    };
    resolver?: {
        id: string;
        username: string;
    } | null;
    replies: CommentReply[];
    reactions: CommentReaction[];
    outcome?: string | null;
}

export const commentService = {
    getAll: async (documentId: string) => {
        const response = await apiClient.get<{ success: boolean; data: Comment[] }>(`/comments/doc/${documentId}`);
        return response.data;
    },

    create: async (documentId: string, content: string, positionStart?: number, positionEnd?: number) => {
        const response = await apiClient.post<{ success: boolean; data: Comment }>(`/comments/doc/${documentId}`, {
            content,
            positionStart,
            positionEnd
        });
        return response.data;
    },

    reply: async (commentId: string, content: string) => {
        const response = await apiClient.post<{ success: boolean; data: CommentReply }>(`/comments/${commentId}/replies`, { content });
        return response.data;
    },

    resolve: async (commentId: string, outcome?: string) => {
        const response = await apiClient.patch<{ success: boolean; data: Comment }>(`/comments/${commentId}/resolve`, { outcome });
        return response.data;
    },

    unresolve: async (commentId: string) => {
        const response = await apiClient.patch<{ success: boolean; data: Comment }>(`/comments/${commentId}/unresolve`, {});
        return response.data;
    },

    toggleReaction: async (commentId: string, emoji: string) => {
        const response = await apiClient.post<{ success: boolean; action: 'added' | 'removed'; data?: CommentReaction }>(
            `/comments/${commentId}/reactions`,
            { emoji }
        );
        return response;
    },

    delete: async (commentId: string) => {
        const response = await apiClient.delete<{ success: boolean; message: string }>(`/comments/${commentId}`);
        return response;
    }
};
