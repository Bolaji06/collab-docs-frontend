
import { DashboardLayout } from "./DashboardLayout";
import { Loader, Trash2, LayoutGrid, List, RotateCcw, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useUserStore } from "../../store/useUserStore";

export default function TrashPage() {
    const { isLoading: isUserLoading } = useUserStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await documentService.getDeleted();
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load deleted documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setProcessingId(id);
        try {
            await documentService.restore(id);
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (error) {
            console.error("Failed to restore document:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handlePermanentDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to permanently delete this document? This cannot be undone.")) return;

        setProcessingId(id);
        try {
            await documentService.permanentlyDelete(id);
            setDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (error) {
            console.error("Failed to delete document permanently:", error);
        } finally {
            setProcessingId(null);
        }
    };

    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayDocs = filteredDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner?.username || "Me",
        date: doc.deletedAt ? new Date(doc.deletedAt).toLocaleString() : "Unknown"
    }));

    if (isLoading || isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 bg-opacity-60 dark:bg-[#121212]">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Trash
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Propably deleted documents. Restore them or delete them permanently.
                </p>
            </div>

            {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <Trash2 className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Trash is empty
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
                        Deleted items will appear here.
                    </p>
                </div>
            ) : (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                            {filteredDocuments.length} Documents
                        </h2>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'list' ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider rounded-t-2xl">
                                <div className="pl-12">Document Name</div>
                                <div className="hidden sm:block">Owner</div>
                                <div className="hidden sm:block text-right pr-8">Date Deleted</div>
                                <div className="w-24"></div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {displayDocs.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500 dark:text-zinc-500">
                                        <p>No documents matching "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    displayDocs.map((doc, index) => (
                                        <motion.div
                                            key={doc.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            {/* Reuse partial logic or custom UI since DocumentRow has click handlers we might want to override */}
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="p-2 shrink-0 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-500">
                                                    <Trash2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0 truncate">
                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                        {doc.title}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400 truncate">
                                                {doc.owner}
                                            </div>

                                            <div className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400 text-right pr-8 truncate">
                                                {doc.date}
                                            </div>

                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleRestore(doc.id, e)}
                                                    disabled={processingId === doc.id}
                                                    className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                    title="Restore"
                                                >
                                                    {processingId === doc.id ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={(e) => handlePermanentDelete(doc.id, e)}
                                                    disabled={processingId === doc.id}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {displayDocs.map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-red-500/30 dark:hover:border-red-500/30 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl">
                                            <Trash2 className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => handleRestore(doc.id, e)}
                                                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"
                                                title="Restore"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handlePermanentDelete(doc.id, e)}
                                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                                title="Delete Permanently"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                                        {doc.title}
                                    </h3>
                                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                                        Deleted {doc.date}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            )}
        </DashboardLayout>
    );
}
