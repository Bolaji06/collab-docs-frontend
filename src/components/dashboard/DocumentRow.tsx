
import { FileText, MoreHorizontal, Trash, ExternalLink, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface DocumentRowProps {
    title: string;
    owner: string;
    date: string;
    onClick: () => void;
    onDelete?: () => void;
    onRename?: () => void;
}

export function DocumentRow({ title, owner, date, onClick, onDelete, onRename }: DocumentRowProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onDelete?.();
    };

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(false);
        onRename?.();
    };

    return (
        <motion.div
            layout
            onClick={onClick}
            whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.03)" }}
            className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center p-4 border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group relative"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 truncate">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 sm:hidden">
                        {date}
                    </p>
                </div>
            </div>

            <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400 truncate">
                {owner}
            </div>

            <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400 text-right pr-8 truncate">
                {date}
            </div>

            <div className="relative w-10 flex justify-end">
                <button
                    onClick={handleMenuClick}
                    className="p-2 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open
                                </button>
                                <button
                                    onClick={handleRename}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Rename
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                >
                                    <Trash className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
