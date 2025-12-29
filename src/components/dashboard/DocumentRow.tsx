import { FileText, Clock, MoreHorizontal, ExternalLink, Pencil, Trash, FolderInput, User, Brain, Scale, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, memo } from "react";

interface DocumentRowProps {
    id: string;
    title: string;
    lastEdited: string;
    owner?: {
        username: string;
        email: string;
        avatar?: string | null;
    };
    tags?: { tag: { name: string; color: string | null } }[];
    onClick?: () => void;
    onDelete?: () => void;
    onRename?: () => void;
    onMove?: () => void;
    intent?: string;
}

import { useDragStore } from "../../store/useDragStore";

export const DocumentRow = memo(function DocumentRow({ id, title, lastEdited, owner, tags, onClick, onDelete, onRename, onMove, intent }: DocumentRowProps) {
    const { setDraggedItem, clearDraggedItem } = useDragStore();
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

    return (
        <motion.div
            layout
            drag
            dragSnapToOrigin
            dragElastic={0.05}
            whileDrag={{
                scale: 1.05,
                zIndex: 9999,
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.2)",
                pointerEvents: "none"
            }}
            onDragStart={() => setDraggedItem(id, title)}
            onDragEnd={() => setTimeout(clearDraggedItem, 100)}
            onClick={onClick}
            className="group grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-md transition-all duration-200 cursor-pointer items-center touch-none"
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className={`p-2 rounded-lg transition-colors shrink-0 ${intent === 'brainstorming' ? 'bg-amber-50 dark:bg-amber-500/10 group-hover:bg-amber-100' :
                    intent === 'decision' ? 'bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100' :
                        intent === 'documentation' ? 'bg-purple-50 dark:bg-purple-500/10 group-hover:bg-purple-100' :
                            intent === 'execution' ? 'bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100' :
                                'bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100'
                    }`}>
                    {intent === 'brainstorming' && <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                    {intent === 'decision' && <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    {intent === 'documentation' && <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                    {intent === 'execution' && <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                    {!intent && <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {title}
                        </h3>
                        {tags && tags.length > 0 && (
                            <div className="flex gap-1.5 overflow-hidden">
                                {tags.slice(0, 2).map((t, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border border-transparent dark:border-zinc-700/50"
                                        style={{
                                            backgroundColor: t.tag.color ? `${t.tag.color}20` : '#8B5CF620',
                                            color: t.tag.color || '#8B5CF6'
                                        }}
                                    >
                                        {t.tag.name}
                                    </span>
                                ))}
                                {tags.length > 2 && (
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">+{tags.length - 2}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-4 border-l border-gray-100 dark:border-zinc-800/50">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {owner?.avatar ? (
                        <img src={owner.avatar} alt={owner.username} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </div>
                <span className="text-xs text-gray-600 dark:text-zinc-400 truncate">
                    {owner?.username || "Me"}
                </span>
            </div>

            <div className="hidden sm:flex items-center justify-end pr-8 gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{lastEdited}</span>
            </div>

            <div className="relative">
                <button
                    onClick={handleMenuClick}
                    className="p-1.5 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
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
        </motion.div>
    );
});
