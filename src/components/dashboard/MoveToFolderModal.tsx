import { motion, AnimatePresence } from "framer-motion";
import { Folder as FolderIcon, X, Search, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { folderService, type Folder } from "../../services/folder-service";

interface MoveToFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentTitle: string;
    currentFolderId?: string | null;
    onMove: (folderId: string | null) => Promise<void>;
}

export function MoveToFolderModal({ isOpen, onClose, documentTitle, currentFolderId, onMove }: MoveToFolderModalProps) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [_, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadFolders();
        }
    }, [isOpen]);

    const loadFolders = async () => {
        try {
            const data = await folderService.getAll();
            setFolders(data);
        } catch (error) {
            console.error("Failed to load folders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredFolders = folders.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMove = async (folderId: string | null) => {
        setIsMoving(true);
        try {
            await onMove(folderId);
            onClose();
        } catch (error) {
            console.error("Failed to move document", error);
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Move to folder
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1 truncate max-w-[300px]">
                                    {documentTitle}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-gray-50 dark:border-zinc-800/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search folders..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border-none rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Folders List */}
                        <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                            <button
                                onClick={() => handleMove(null)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${!currentFolderId ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderIcon className="w-4 h-4" />
                                    <span>All Documents (Root)</span>
                                </div>
                                {!currentFolderId && <Check className="w-4 h-4" />}
                            </button>

                            {filteredFolders.map((folder) => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMove(folder.id)}
                                    disabled={isMoving}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors mt-1 ${currentFolderId === folder.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderIcon className="w-4 h-4" />
                                        <span>{folder.name}</span>
                                    </div>
                                    {currentFolderId === folder.id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800">
                            <button
                                onClick={() => handleMove(null)}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                            >
                                Remove from current folder
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
