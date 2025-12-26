import { FileText, Clock, MoreHorizontal, ExternalLink, Pencil, Trash, FolderInput } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface DocumentCardProps {
    id: string;
    title: string;
    lastEdited: string;
    icon?: React.ReactNode;
    tags?: { tag: { name: string; color: string | null } }[];
    onClick?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onMove?: () => void;
}

import { useDragStore } from "../../store/useDragStore";

export function DocumentCard({ id, title, lastEdited, icon, tags, onClick, onDelete, onRename, onMove }: DocumentCardProps) {
    const { setDraggedItem, clearDraggedItem } = useDragStore();
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
            drag
            dragSnapToOrigin
            dragElastic={0.1}
            whileDrag={{
                scale: 1.1,
                rotate: 2,
                zIndex: 9999,
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
                pointerEvents: "none"
            }}
            onDragStart={() => setDraggedItem(id, title)}
            onDragEnd={() => setTimeout(clearDraggedItem, 100)} // Small delay to allow dropping logic in Sidebar
            onClick={onClick}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full touch-none"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors shrink-0">
                        {icon || <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                            {tags.slice(0, 2).map((t, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap"
                                    style={{
                                        backgroundColor: t.tag.color ? `${t.tag.color}20` : '#8B5CF620',
                                        color: t.tag.color || '#8B5CF6'
                                    }}
                                >
                                    {t.tag.name}
                                </span>
                            ))}
                            {tags.length > 2 && (
                                <span className="text-[9px] text-gray-400 dark:text-zinc-500 self-center">
                                    +{tags.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Menu Button */}
                <div className="relative">
                    <button
                        onClick={handleMenuClick}
                        className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {/* ... (rest of menu logic remains same) */}

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
                                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onMove?.(); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                    >
                                        <FolderInput className="w-4 h-4" />
                                        Move to folder
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1" />
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

            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {title}
                </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Last edited {lastEdited}</span>
            </div>
        </motion.div >
    );
}
