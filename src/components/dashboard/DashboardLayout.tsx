
import { useUserStore } from "../../store/useUserStore";
import { ThemeToggle } from "../ThemeToggle";
import { Sidebar } from "./Sidebar";
import { Search } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


interface DashboardLayoutProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function DashboardLayout({ children, searchQuery, onSearchChange }: DashboardLayoutProps) {
    const { user, isLoading: isUserLoading, error } = useUserStore();
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
            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-8 transition-colors duration-300 relative z-30">
                    <div className="flex-1 max-w-xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery || ''}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                                placeholder="Search documents, teams, or keywords..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                        <NotificationDropdown />

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
        </div>
    );
}
