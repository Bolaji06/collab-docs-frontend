import { useState, useEffect } from "react";
import { Tag as TagIcon, ChevronDown, Check } from "lucide-react";
import { tagService, type Tag } from "../../services/tag-service";
import { motion, AnimatePresence } from "framer-motion";

interface TagFilterProps {
    activeTagId?: string | null;
    onSelectTag: (tagId: string | null) => void;
}

export function TagFilter({ activeTagId, onSelectTag }: TagFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tags.length === 0) {
            loadTags();
        }
    }, [isOpen]);

    const loadTags = async () => {
        setIsLoading(true);
        try {
            const data = await tagService.getAll();
            setTags(data);
        } catch (error) {
            console.error("Failed to load tags for filter", error);
        } finally {
            setIsLoading(false);
        }
    };

    const activeTag = tags.find(t => t.id === activeTagId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTagId
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }`}
            >
                <TagIcon className="w-4 h-4" />
                <span>{activeTag ? activeTag.name : "Filter by Tag"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 z-50 overflow-hidden"
                        >
                            <div className="p-2 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-2">
                                    Tags
                                </span>
                                {activeTagId && (
                                    <button
                                        onClick={() => { onSelectTag(null); setIsOpen(false); }}
                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="max-h-60 overflow-y-auto p-1">
                                {isLoading ? (
                                    <div className="p-4 text-center text-xs text-gray-500">Loading...</div>
                                ) : tags.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-400">No tags found</div>
                                ) : (
                                    tags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => {
                                                onSelectTag(tag.id === activeTagId ? null : tag.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${tag.id === activeTagId
                                                ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: tag.color || '#6366f1' }}
                                                />
                                                <span>{tag.name}</span>
                                            </div>
                                            {tag.id === activeTagId && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
