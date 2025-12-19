
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

export interface Comment {
    id: string;
    documentId: string;
    userId: string;
    content: string;
    positionStart: number;
    positionEnd: number;
    resolved: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        email: string;
        avatar: string | null;
    };
    replies: CommentReply[];
}

export const commentService = {
    getAll: async (documentId: string) => {
        return apiClient.get<{ data: Comment[] }>(`/documents/${documentId}/comments`);
    },

    create: async (documentId: string, content: string, positionStart?: number, positionEnd?: number) => {
        return apiClient.post<{ data: Comment }>(`/documents/${documentId}/comments`, {
            content,
            positionStart,
            positionEnd
        });
    },

    reply: async (commentId: string, content: string) => {
        return apiClient.post<{ data: CommentReply }>(`/comments/${commentId}/reply`, { content });
    },

    resolve: async (commentId: string) => {
        return apiClient.patch<{ data: Comment }>(`/comments/${commentId}/resolve`, {});
    },

    delete: async (commentId: string) => {
        return apiClient.delete<{ success: boolean; message: string }>(`/comments/${commentId}`);
    }
};
