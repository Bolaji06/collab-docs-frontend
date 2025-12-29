import { create } from 'zustand';
import { apiClient } from '../services/api-client';

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    isPremium: boolean;
    onboardingCompleted: boolean;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    fetchUser: () => Promise<void>;
    setUser: (user: User | null) => void;
    completeOnboarding: () => Promise<void>;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
            if (response.success && response.data) {
                set({ user: response.data, isLoading: false, error: null });
            } else {
                // Fallback or handle cases where structure might be different or success is false
                set({ user: null, isLoading: false, error: "Failed to load user data" });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            set({ user: null, isLoading: false, error: message });
        }
    },
    setUser: (user) => set({ user }),
    completeOnboarding: async () => {
        try {
            const response = await apiClient.post<{ success: boolean; data: User }>('/auth/onboarding/complete', {});
            if (response.success && response.data) {
                set({ user: response.data });
            }
        } catch (error) {
            console.error("Failed to complete onboarding", error);
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null });
    }
}));
