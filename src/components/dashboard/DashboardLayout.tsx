import { useUserStore } from "../../store/useUserStore";
import { ThemeToggle } from "../ThemeToggle";
import { Sidebar } from "./Sidebar";
import { Search, X, Menu } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

import { ActivityFeed } from "./ActivityFeed";
import { TagFilter } from "./TagFilter";
import { IntentFilter } from "./IntentFilter";
import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { useNavigate } from "react-router-dom";


interface DashboardLayoutProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    activeTagId?: string | null;
    onSelectTag?: (tagId: string | null) => void;
    activeFilters?: {
        type: 'folder' | 'tag';
        id: string;
        name: string;
        color?: string;
    }[];
    onClearFilter?: (type: 'folder' | 'tag', id: string) => void;
    activeIntent?: string | null;
    onSelectIntent?: (intent: string | null) => void;
}

export function DashboardLayout({ children, searchQuery, onSearchChange, activeFilters, onClearFilter, activeTagId, onSelectTag, activeIntent, onSelectIntent }: DashboardLayoutProps) {
    const { user, isLoading: isUserLoading, error } = useUserStore();
    const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigator = useNavigate();

    useEffect(() => {
        if (!isUserLoading && !user && !error) {
            navigator('/auth');
        }
    }, [isUserLoading, user, error, navigator]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-md mx-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Unable to connect
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 mb-6">
                        {error === "Failed to fetch"
                            ? "We couldn't connect to the server. Please check your internet connection or try again later."
                            : error || "Something went wrong while loading your profile."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        Retry Connection
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('refreshToken');
                            navigator('/auth');
                        }}
                        className="block w-full mt-4 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
                    >
                        Sign in with different account
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 transition-colors duration-300 relative z-30">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg md:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery || ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder="Search documents, teams, or keywords..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            />
                        </div>

                        {/* Filter Chips */}
                        {activeFilters && activeFilters.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {activeFilters.map((filter) => (
                                    <div
                                        key={`${filter.type}-${filter.id}`}
                                        className="flex items-center gap-2 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold animate-in fade-in slide-in-from-left-2 duration-300 group/chip border border-indigo-100 dark:border-indigo-500/20 shadow-sm"
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: filter.color || (filter.type === 'folder' ? '#6366f1' : '#10b981') }}
                                        />
                                        <span className="capitalize opacity-60 text-[10px] tracking-wider">{filter.type}:</span>
                                        <span>{filter.name}</span>
                                        <button
                                            onClick={() => onClearFilter?.(filter.type, filter.id)}
                                            className="hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors ml-1 p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => activeFilters.forEach(f => onClearFilter?.(f.type, f.id))}
                                    className="text-[10px] text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 font-bold uppercase tracking-widest px-2 py-1 transition-colors"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <IntentFilter activeIntent={activeIntent || null} onSelectIntent={onSelectIntent || (() => { })} />
                        <TagFilter activeTagId={activeTagId} onSelectTag={onSelectTag || (() => { })} />

                        <NotificationCenter />


                        <button
                            onClick={() => setIsActivityFeedOpen(true)}
                            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all relative group"
                            title="Activity Feed"
                        >
                            <History className="w-5 h-5" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-900 scale-0 group-hover:scale-100 transition-transform"></span>
                        </button>

                        <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800"></div>

                        <ThemeToggle />

                        <div className="flex items-center gap-3 pl-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                <img src={user?.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 hidden sm:block">
                                {user?.username}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>

            <ActivityFeed
                isOpen={isActivityFeedOpen}
                onClose={() => setIsActivityFeedOpen(false)}
            />
        </div>
    );
}
