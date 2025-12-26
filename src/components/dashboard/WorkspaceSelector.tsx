import React, { useState, useEffect } from 'react';
import { workspaceService } from '../../services/workspace-service';
import type { Workspace } from '../../services/workspace-service';
import {
    ChevronDown,
    Plus,
    Users,
    User,
    Check,
} from 'lucide-react';
import { clsx } from 'clsx';

interface WorkspaceSelectorProps {
    currentWorkspaceId: string | null;
    onWorkspaceChange: (workspaceId: string | null) => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
    currentWorkspaceId,
    onWorkspaceChange
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const data = await workspaceService.getWorkspaces();
            setWorkspaces(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch workspaces:', error);
            setWorkspaces([]);
        }
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        try {
            const workspace = await workspaceService.createWorkspace(newWorkspaceName);
            setWorkspaces([...workspaces, workspace]);
            setNewWorkspaceName('');
            setIsCreating(false);
            onWorkspaceChange(workspace.id);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create workspace:', error);
        }
    };

    const currentWorkspace = Array.isArray(workspaces) ? workspaces.find(w => w.id === currentWorkspaceId) : null;

    return (
        <div className="relative mb-4 px-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm group"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        {currentWorkspaceId ? (
                            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Workspace
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                            {currentWorkspace?.name || 'Personal'}
                        </span>
                    </div>
                </div>
                <ChevronDown className={clsx(
                    "w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => {
                            setIsOpen(false);
                            setIsCreating(false);
                        }}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 z-[101] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => {
                                    onWorkspaceChange(null);
                                    setIsOpen(false);
                                }}
                                className={clsx(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                    !currentWorkspaceId
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span>Personal</span>
                                </div>
                                {!currentWorkspaceId && <Check className="w-4 h-4" />}
                            </button>

                            <div className="pt-2 pb-1 px-3">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Team Workspaces
                                </span>
                            </div>

                            {Array.isArray(workspaces) && workspaces.map(workspace => (
                                <button
                                    key={workspace.id}
                                    onClick={() => {
                                        onWorkspaceChange(workspace.id);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                        currentWorkspaceId === workspace.id
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        <span>{workspace.name}</span>
                                    </div>
                                    {currentWorkspaceId === workspace.id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                            {isCreating ? (
                                <form onSubmit={handleCreateWorkspace} className="space-y-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Workspace name..."
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>New Workspace</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
