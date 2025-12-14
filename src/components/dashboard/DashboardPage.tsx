
import { DashboardLayout } from "./DashboardLayout";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { Plus, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

export default function DashboardPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; docId: string | null; title: string }>({
        isOpen: false,
        docId: null,
        title: ""
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await documentService.getAll();
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDocument = async () => {
        try {
            const newDoc = await documentService.create("Untitled Document");
            navigate(`/doc/${newDoc.id}`);
        } catch (error) {
            console.error("Failed to create document:", error);
        }
    };

    const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, docId: id, title: title });
    };

    const confirmDelete = async () => {
        if (!deleteModal.docId) return;

        setIsDeleting(true);
        try {
            await documentService.delete(deleteModal.docId);
            setDocuments(documents.filter(doc => doc.id !== deleteModal.docId));
            setDeleteModal({ isOpen: false, docId: null, title: "" });
        } catch (error) {
            console.error("Failed to delete document:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter for quick access (e.g., modified recently)
    const quickAccess = documents.slice(0, 4).map(doc => ({
        id: doc.id,
        title: doc.title,
        lastEdited: new Date(doc.updatedAt).toLocaleDateString()
    }));

    // Recent docs logic: if showAll is false, show only 5, else show all
    // Also filtering out the ones in "Quick Access" might be redundant but usually lists show everything.
    // Let's just show top 5 unless view all.
    const displayDocs = showAll ? documents : documents.slice(0, 5);

    const recentDocs = displayDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner?.username || "Me",
        date: new Date(doc.updatedAt).toLocaleString()
    }));

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 bg-opacity-60 dark:bg-[#121212]">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white animate-gradient-x">
                        Welcome back, Josh
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400">
                        Here's what's been happening with your projects.
                    </p>
                </div>

                {/* Quick Access Grid */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                        Quick Access
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickAccess.map((doc, index) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <DocumentCard
                                    title={doc.title}
                                    lastEdited={doc.lastEdited}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Recent Documents List */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                            Recent Documents
                        </h2>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        >
                            {showAll ? "Show less" : "View all"}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider rounded-t-2xl">
                            <div className="pl-12">Document Name</div>
                            <div className="hidden sm:block">Owner</div>
                            <div className="hidden sm:block text-right pr-8">Date Modified</div>
                            <div className="w-10"></div>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                            {recentDocs.map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (index * 0.05) }}
                                >
                                    <DocumentRow
                                        title={doc.title}
                                        owner={doc.owner}
                                        date={doc.date}
                                        onClick={() => navigate(`/doc/${doc.id}`)}
                                        onDelete={() => handleDeleteClick(doc.id, doc.title, { stopPropagation: () => { } } as React.MouseEvent)}
                                    />

                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Floating Action Button */}
            <motion.button
                onClick={handleCreateDocument}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 text-white z-50 hover:shadow-indigo-500/50 transition-shadow cursor-pointer"
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Delete Document"
                description={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
                isDeleting={isDeleting}
            />
        </DashboardLayout>
    );
}
