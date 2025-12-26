import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
    currentWorkspaceId: string | null;
    setWorkspaceId: (workspaceId: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            currentWorkspaceId: null,
            setWorkspaceId: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
        }),
        {
            name: 'workspace-storage',
        }
    )
);
