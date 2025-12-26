import { useEffect, useState } from 'react';
import { versionService } from '../../services/version-service';
import type { DocumentVersion } from '../../services/version-service';
import { formatDistanceToNow } from 'date-fns';
import {
    History,
    RotateCcw,
    Save,
    X,
    Clock,
    User,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VersionHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    onRestore: (content: any) => void;
}

export function VersionHistory({ isOpen, onClose, documentId, onRestore }: VersionHistoryProps) {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadVersions = async () => {
        setIsLoading(true);
        try {
            const data = await versionService.getVersions(documentId);
            setVersions(data);
        } catch (error) {
            console.error('Failed to load versions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSnapshot = async () => {
        setIsSaving(true);
        try {
            await versionService.createSnapshot(documentId);
            await loadVersions();
        } catch (error) {
            console.error('Failed to create snapshot', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestore = async (version: DocumentVersion) => {
        if (!confirm('Are you sure you want to restore this version? Current unsaved changes might be lost.')) return;

        try {
            await versionService.restoreVersion(documentId, version.id);
            onRestore(version.content);
            onClose();
        } catch (error) {
            console.error('Failed to restore version', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadVersions();
        }
    }, [isOpen, documentId]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-white dark:bg-zinc-900 shadow-2xl z-[101] flex flex-col border-l border-gray-200 dark:border-zinc-800"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-indigo-500" />
                                    Version History
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Restore previous states of this document</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 border-b border-indigo-100/50 dark:border-indigo-500/10">
                            <button
                                onClick={handleCreateSnapshot}
                                disabled={isSaving}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Current Version
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2" />
                                                <div className="h-3 bg-gray-100 dark:bg-zinc-800/50 rounded w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-gray-500 dark:text-zinc-400 font-medium">No versions saved yet</p>
                                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2 px-10">Save a version to keep a snapshot of your progress</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {versions.map((version, idx) => (
                                        <motion.div
                                            key={version.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md transition-all cursor-default"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3">
                                                    <div className="mt-1 w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                            Version {version.versionNumber}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-zinc-500">
                                                            <User className="w-3 h-3" />
                                                            <span>{version.user.username}</span>
                                                            <span>•</span>
                                                            <span>{formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRestore(version)}
                                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 text-xs font-bold"
                                                    title="Restore this version"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Restore
                                                </button>
                                            </div>

                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:hidden transition-all opacity-40">
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
