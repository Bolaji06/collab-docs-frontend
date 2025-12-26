import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderIcon, X, Trash2, FileText } from "lucide-react";

interface FolderDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (deleteDocuments: boolean) => void;
    folderName: string;
    documentCount?: number;
    isDeleting?: boolean;
}

export function FolderDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    folderName,
    documentCount = 0,
    isDeleting
}: FolderDeleteModalProps) {
    const [deleteDocuments, setDeleteDocuments] = useState(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with extreme blur and glass effect */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden pointer-events-auto relative"
                        >
                            {/* Decorative Top Pattern */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-50" />

                            <div className="relative p-8">
                                {/* Header with Icon */}
                                <div className="flex items-start justify-between mb-8">
                                    <div className="relative">
                                        <motion.div
                                            initial={{ rotate: -10 }}
                                            animate={{ rotate: 0 }}
                                            className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center group"
                                        >
                                            <FolderIcon className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" />
                                            {/* Pulse effect */}
                                            <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-ping opacity-20" />

                                            {/* Mini Delete Overlay */}
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                                <X className="w-3 h-3 text-white" />
                                            </div>
                                        </motion.div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="space-y-4 mb-10">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        Delete Folder?
                                    </h2>
                                    <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">
                                        You're about to delete <span className="font-semibold text-gray-900 dark:text-white px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-md">"{folderName}"</span>.
                                    </p>

                                    {/* Info Card with Toggle */}
                                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800/50 flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                                                <FileText className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {documentCount} {documentCount === 1 ? 'document' : 'documents'} inside
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-zinc-500">
                                                    {deleteDocuments
                                                        ? "These will be permanently deleted."
                                                        : "These will be moved to your workspace root."}
                                                </p>
                                            </div>
                                        </div>

                                        {documentCount > 0 && (
                                            <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 mt-1 flex items-center justify-between">
                                                <label htmlFor="bulk-delete" className="text-sm font-medium text-gray-700 dark:text-zinc-300 cursor-pointer">
                                                    Delete all documents inside
                                                </label>
                                                <div
                                                    className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${deleteDocuments ? 'bg-red-500' : 'bg-gray-300 dark:bg-zinc-600'}`}
                                                    onClick={() => setDeleteDocuments(!deleteDocuments)}
                                                >
                                                    <motion.div
                                                        animate={{ x: deleteDocuments ? 22 : 2 }}
                                                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-2xl transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onConfirm(deleteDocuments)}
                                        disabled={isDeleting}
                                        className="flex-[1.5] px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:active:scale-100 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 trash-shake" />
                                                Delete Folder
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
                .group:hover .trash-shake {
                    animation: shake 0.5s ease-in-out infinite;
                }
            `}</style>
        </AnimatePresence>
    );
}
