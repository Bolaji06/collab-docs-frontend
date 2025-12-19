
import { DashboardLayout } from "./DashboardLayout";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { Plus, Loader, Upload, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useNavigate } from "react-router-dom";
import { RenameModal } from "./RenameModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { useUserStore } from "../../store/useUserStore";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
// Using URL-based import for Vite
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function DashboardPage() {
    const { user, isLoading: isUserLoading } = useUserStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; docId: string | null; title: string }>({
        isOpen: false,
        docId: null,
        title: ""
    });
    const [renameModal, setRenameModal] = useState<{ isOpen: boolean; docId: string | null; title: string }>({
        isOpen: false,
        docId: null,
        title: ""
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // ... (handleFileImport remains same)

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... previous implementation ...
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            let content = '';
            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += `<p>${pageText}</p>`;
                }
                content = fullText;
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                content = result.value;
            } else {
                throw new Error('Unsupported file type');
            }

            // Create new document
            const newDoc = await documentService.create(title);

            // Update with content
            await documentService.update(newDoc.id, { content });

            navigate(`/doc/${newDoc.id}`);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import document. Please try again.');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

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

    const handleRenameClick = (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameModal({ isOpen: true, docId: id, title: title });
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

    const confirmRename = async (newTitle: string) => {
        if (!renameModal.docId) return;

        setIsRenaming(true);
        try {
            await documentService.update(renameModal.docId, { title: newTitle });
            setDocuments(documents.map(doc =>
                doc.id === renameModal.docId ? { ...doc, title: newTitle } : doc
            ));
            setRenameModal({ isOpen: false, docId: null, title: "" });
        } catch (error) {
            console.error("Failed to rename document:", error);
        } finally {
            setIsRenaming(false);
        }
    };

    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter for quick access (e.g., modified recently)
    const quickAccess = filteredDocuments.slice(0, 4).map(doc => ({
        id: doc.id,
        title: doc.title,
        lastEdited: new Date(doc.updatedAt).toLocaleDateString()
    }));

    // Recent docs logic
    const displayDocs = showAll ? filteredDocuments : filteredDocuments.slice(0, 5);

    const recentDocs = displayDocs.map(doc => ({
        id: doc.id,
        title: doc.title,
        owner: doc.owner?.username || "Me",
        date: new Date(doc.updatedAt).toLocaleString()
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
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileImport}
            />
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white animate-gradient-x">
                    Welcome back, {user?.username}
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Here's what's been happening with your projects.
                </p>
            </div>

            {documents.length === 0 ? (
                /* Main Empty State (No documents at all) */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                        <Upload className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Create your first document
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-sm mb-8">
                        Get started by creating a new document or importing an existing one to collaborate with your team.
                    </p>
                    <div className="flex gap-4">
                        <motion.button
                            onClick={handleCreateDocument}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            New Document
                        </motion.button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 font-medium rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                        >
                            <Upload className="w-5 h-5" />
                            Import
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Access Grid */}
                    <section className="my-8">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-6">
                            Quick Access
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {quickAccess.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-400 dark:text-zinc-500 italic">
                                    No recent documents found matching "{searchQuery}"
                                </div>
                            ) : (
                                quickAccess.map((doc, index) => (
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
                                ))
                            )}
                        </div>
                    </section>

                    {/* Recent Documents List */}
                    <section className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                Recent Documents
                            </h2>
                            <div className="flex items-center gap-4">
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
                                {filteredDocuments.length > 5 && (
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        {showAll ? "Show less" : "View all"}
                                    </button>
                                )}
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
                                    {recentDocs.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 dark:text-zinc-500">
                                            <p>No documents matching "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        recentDocs.map((doc, index) => (
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
                                                    onRename={() => handleRenameClick(doc.id, doc.title, { stopPropagation: () => { } } as React.MouseEvent)}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {recentDocs.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-500 dark:text-zinc-500">
                                        <p>No documents matching "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    recentDocs.map((doc, index) => (
                                        <motion.div
                                            key={doc.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (index * 0.05) }}
                                        >
                                            <DocumentCard
                                                title={doc.title}
                                                lastEdited={doc.date}
                                                onClick={() => navigate(`/doc/${doc.id}`)}
                                                onDelete={() => handleDeleteClick(doc.id, doc.title, { stopPropagation: () => { } } as React.MouseEvent)}
                                                onRename={() => handleRenameClick(doc.id, doc.title, { stopPropagation: () => { } } as React.MouseEvent)}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}


            {/* Floating Action Buttons */}
            {
                documents.length > 0 && (
                    <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">


                        <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isImporting}
                            className="p-3 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 group relative"
                            title="Import Document"
                        >
                            {isImporting ? (
                                <Loader className="w-5 h-5 animate-spin text-indigo-500" />
                            ) : (
                                <Upload className="w-5 h-5" />
                            )}
                            <span className="absolute right-full mr-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Import PDF/DOCX
                            </span>
                        </motion.button>

                        <motion.button
                            onClick={handleCreateDocument}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 text-white hover:shadow-indigo-500/50 transition-shadow cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </motion.button>
                    </div>
                )
            }

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Delete Document"
                description={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
                isDeleting={isDeleting}
            />

            <RenameModal
                isOpen={renameModal.isOpen}
                onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
                onConfirm={confirmRename}
                initialTitle={renameModal.title}
                isRenaming={isRenaming}
            />
        </DashboardLayout >
    );
}
