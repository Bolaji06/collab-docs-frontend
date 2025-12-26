import { motion, AnimatePresence } from "framer-motion";
import { Tag as TagIcon, Plus, Check, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { tagService, type Tag } from "../../services/tag-service";

interface TagSelectorProps {
    documentId: string;
    currentTags: { tag: Tag }[];
    onTagsChange: () => void;
}

export function TagSelector({ documentId, currentTags, onTagsChange }: TagSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState("#6366f1");
    const containerRef = useRef<HTMLDivElement>(null);

    const colors = [
        "#6366f1", "#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#6b7280"
    ];

    useEffect(() => {
        if (isOpen) {
            loadTags();
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const loadTags = async () => {
        try {
            const tags = await tagService.getAll();
            setAllTags(tags);
        } catch (error) {
            console.error("Failed to load tags", error);
        }
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };

    const handleAddTag = async (tagId: string) => {
        try {
            await tagService.addToDocument(documentId, tagId);
            onTagsChange();
        } catch (error) {
            console.error("Failed to add tag", error);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        try {
            await tagService.removeFromDocument(documentId, tagId);
            onTagsChange();
        } catch (error) {
            console.error("Failed to remove tag", error);
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        try {
            const nextTag = await tagService.create(newTagName.trim(), newTagColor);
            await tagService.addToDocument(documentId, nextTag.id);
            setNewTagName("");
            setIsCreating(false);
            loadTags();
            onTagsChange();
        } catch (error) {
            console.error("Failed to create tag", error);
        }
    };

    const filteredTags = allTags.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isTagAssigned = (tagId: string) => currentTags.some(t => t.tag.id === tagId);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
                <TagIcon className="w-3.5 h-3.5" />
                Manage Tags
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 z-100 overflow-hidden"
                    >
                        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tags..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border-none rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {filteredTags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => isTagAssigned(tag.id) ? handleRemoveTag(tag.id) : handleAddTag(tag.id)}
                                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: tag.color || '#6366f1' }}
                                        />
                                        <span className="text-xs text-gray-700 dark:text-zinc-300">{tag.name}</span>
                                    </div>
                                    {isTagAssigned(tag.id) && <Check className="w-3 h-3 text-indigo-500" />}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 border-t border-gray-100 dark:border-zinc-800">
                            {isCreating ? (
                                <form onSubmit={handleCreateTag} className="space-y-3 p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-gray-500 dark:text-zinc-500 uppercase">Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newTagName}
                                            onChange={(e) => setNewTagName(e.target.value)}
                                            placeholder="Tag name..."
                                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-gray-500 dark:text-zinc-500 uppercase">Color</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {colors.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setNewTagColor(c)}
                                                    className={`w-5 h-5 rounded-full transition-all ${newTagColor === c ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900' : 'hover:scale-105'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreating(false)}
                                            className="flex-1 py-2 bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 text-xs font-semibold rounded-md border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
                                        >
                                            Create
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Create new tag
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
