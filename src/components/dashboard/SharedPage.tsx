
import { DashboardLayout } from "./DashboardLayout";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { Loader, Users, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";

export default function SharedPage() {
    const { isLoading: isUserLoading } = useUserStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const navigate = useNavigate();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await documentService.getShared();
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load shared documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter documents based on search query
    const filteredDocuments = documents?.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const displayDocs = filteredDocuments?.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner || { username: "Unknown", email: "" },
        lastEdited: new Date(doc.updatedAt).toLocaleString()
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
                    Shared with me
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Documents that others have shared with you.
                </p>
            </div>

            {documents?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No shared documents
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-sm">
                        When someone shares a document with you, it will appear here.
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
                                <div className="hidden sm:block text-right pr-8">Date Modified</div>
                                <div className="w-10"></div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {!displayDocs || displayDocs.length === 0 ? (
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
                                        >
                                            <DocumentRow
                                                id={doc.id}
                                                title={doc.title}
                                                owner={doc.owner}
                                                lastEdited={doc.lastEdited}
                                                onClick={() => navigate(`/doc/${doc.id}`)}
                                            // No delete/rename for shared docs usually, unless editor permissions allow. 
                                            // For now, keep it simple: just view/open.
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {!displayDocs || displayDocs.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-500 dark:text-zinc-500">
                                    <p>No documents matching "{searchQuery}"</p>
                                </div>
                            ) : (
                                displayDocs.map((doc, index) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <DocumentCard
                                            id={doc.id}
                                            title={doc.title}
                                            lastEdited={doc.lastEdited}
                                            onClick={() => navigate(`/doc/${doc.id}`)}
                                            icon={<Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                                        />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </section>
            )}
        </DashboardLayout>
    );
}
