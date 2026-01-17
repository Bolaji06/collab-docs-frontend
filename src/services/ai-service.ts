import { apiClient } from './api-client';

export interface AIResponse {
    result: string;
}

export interface AITagResponse {
    result: string[];
}

export const aiService = {
    summarizeText: (text: string) =>
        apiClient.post<AIResponse>('/ai/summarize', { text }),

    generateText: (text: string) =>
        apiClient.post<AIResponse>('/ai/summarize', {
            text: `Continue writing this text. Maintain the style and tone. Context: ${text}`
        }),

    improveWriting: (text: string) =>
        apiClient.post<AIResponse>('/ai/improve', { text }),

    extractMeetingNotes: (text: string) =>
        apiClient.post<AIResponse>('/ai/meeting-notes', { text }),

    suggestTags: (text: string) =>
        apiClient.post<AITagResponse>('/ai/suggest-tags', { text }),

    analyzeAlignment: (text: string, intent: string) =>
        apiClient.post<AIResponse>('/ai/analyze-alignment', { text, intent }),

    generateActivityDigest: (activity: string, intent?: string) =>
        apiClient.post<AIResponse>('/ai/summarize', {
            text: `Summarize this recent activity for a returning user: ${activity}. The current document mode is ${intent || 'documentation'}. Prioritize items that match this mode.`
        }),

    analyzeCollaboration: (data: { content: string; comments: any[]; intent?: string }) =>
        apiClient.post<AIResponse>('/ai/summarize', {
            text: `Analyze this document and its discussions for collaboration health. Document Mode: ${data.intent || 'documentation'}. 
            - If in 'brainstorming' mode: look for divergent ideas and creative gaps.
            - If in 'decision' mode: look for alignment debt, unacknowledged risks, and conflicting assumptions.
            - If in 'execution' mode: look for stalled tasks and ownership gaps.
            Document: ${data.content} Comments: ${JSON.stringify(data.comments)}`
        }),

    analyzeDecisionImpact: (data: { decision: string; docContext: string; intent?: string }) =>
        apiClient.post<AIResponse>('/ai/summarize', {
            text: `Analyze the impact of this decision: "${data.decision}" within the context of this document: ${data.docContext}. Document Mode: ${data.intent || 'documentation'}. What other areas are affected?`
        }),

    editContent: (text: string, instruction: string) =>
        apiClient.post<AIResponse>('/ai/edit', { text, instruction }),
};
