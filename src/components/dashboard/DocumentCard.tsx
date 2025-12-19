
import { FileText, Clock, MoreHorizontal, ExternalLink, Pencil, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface DocumentCardProps {
    title: string;
    lastEdited: string;
    icon?: React.ReactNode;
}

export function DocumentCard({ title, lastEdited, icon, onClick, onDelete, onRename }: DocumentCardProps & { onClick?: () => void; onDelete?: () => void; onRename?: () => void; }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    return (
        <motion.div
            layout
            onClick={onClick}
            whileHover={{ y: -2, scale: 1.01 }}
            className="group relative p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                    {icon || <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                </div>

                {/* Menu Button */}
                <div className="relative">
                    <button
                        onClick={handleMenuClick}
                        className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
                                        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename?.(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Rename
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(); }}
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
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Last edited {lastEdited}</span>
            </div>
        </motion.div>
    );
}
