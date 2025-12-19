
import { Home, Clock, Users, Trash, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const logo = "/logo_1.png";

export function Sidebar() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Clock, label: "Recents", path: "/recents" },
        { icon: Users, label: "Shared", path: "/shared" },
        { icon: Trash, label: "Trash", path: "/trash" },
    ];

    return (
        <div className="w-64 h-screen bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-colors duration-300">
            <div className="p-6">
                <div className="flex flex-col items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <img src={logo} alt="CollabDocs" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400">
                        CollabDocs
                    </span>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-gray-200 dark:border-zinc-800">
                <Link
                    to="/settings"
                    className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-all duration-200 ${isActive("/settings")
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                        }`}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/auth';
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 mt-1"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
