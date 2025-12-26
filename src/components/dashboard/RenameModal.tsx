import { useState, useEffect } from "react";
import { X, Loader, FileText, Folder as FolderIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
    "#6366f1", // Indigo
    "#ef4444", // Red
    "#f59e0b", // Amber
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#71717a", // Zinc/Gray
];

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newName: string, color?: string) => Promise<void>;
    initialTitle: string;
    initialColor?: string;
    isRenaming: boolean;
    type?: 'document' | 'folder';
}

export function RenameModal({
    isOpen,
    onClose,
    onConfirm,
    initialTitle,
    initialColor = "#6366f1",
    isRenaming,
    type = 'document'
}: RenameModalProps) {
    const [title, setTitle] = useState(initialTitle);
    const [selectedColor, setSelectedColor] = useState(initialColor);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setSelectedColor(initialColor);
        }
    }, [isOpen, initialTitle, initialColor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onConfirm(title.trim(), type === 'folder' ? selectedColor : undefined);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${type === 'folder'
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                        : 'bg-indigo-50 dark:bg-indigo-500/10'
                                        }`}>
                                        {type === 'folder' ? (
                                            <FolderIcon className="w-6 h-6 text-indigo-500" style={{ color: selectedColor }} />
                                        ) : (
                                            <FileText className="w-6 h-6 text-indigo-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            Rename {type === 'folder' ? 'Folder' : 'Document'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                                            Update the name of your {type}.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 ml-1">
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                        placeholder={`Enter ${type} name...`}
                                        autoFocus
                                    />
                                </div>

                                {type === 'folder' && (
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300 ml-1">
                                            Folder Color
                                        </label>
                                        <div className="flex flex-wrap gap-3 p-1">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`w-8 h-8 rounded-full transition-all relative flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm`}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {selectedColor === color && (
                                                        <motion.div
                                                            layoutId="selectedColor"
                                                            className="absolute inset-0 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center"
                                                        >
                                                            <Check className="w-4 h-4 text-white drop-shadow-sm" />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 pb-8">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isRenaming || !title.trim() || (title === initialTitle && (type !== 'folder' || selectedColor === initialColor))}
                                        className="flex-[1.5] px-6 py-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:active:scale-100 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        {isRenaming ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
