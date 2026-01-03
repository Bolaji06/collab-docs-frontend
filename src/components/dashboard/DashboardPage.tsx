
import { DashboardLayout } from "./DashboardLayout";
import { DocumentCard } from "./DocumentCard";
import { DocumentRow } from "./DocumentRow";
import { Plus, Loader, Upload, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { documentService, type Document } from "../../services/document-service";
import { useNavigate, useParams, } from "react-router-dom";
import { folderService } from "../../services/folder-service";
import { tagService } from "../../services/tag-service";
import { RenameModal } from "./RenameModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { MoveToFolderModal } from "./MoveToFolderModal";
import { WorkspaceIntelligence } from "./WorkspaceIntelligence";
import { WorkspaceAnalytics } from "./WorkspaceAnalytics";
import { TemplateGalleryModal } from "./TemplateGalleryModal";
import { type DocumentTemplate } from "../../services/template-service";
import { useUserStore } from "../../store/useUserStore";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
// Using URL-based import for Vite
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useWorkspaceStore } from "../../store/useWorkspaceStore";
import { parsePdfToHtml } from "../../utils/pdf-utils";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function DashboardPage() {
    const { user, isLoading: isUserLoading } = useUserStore();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
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
    const [moveModal, setMoveModal] = useState<{ isOpen: boolean; docId: string | null; title: string; folderId?: string | null }>({
        isOpen: false,
        docId: null,
        title: "",
        folderId: null
    });
    const [activeFilterDetails, setActiveFilterDetails] = useState<{ type: 'folder' | 'tag', id: string, name: string, color?: string | null }[]>([]);
    const [secondaryTagId, setSecondaryTagId] = useState<string | null>(null);
    const [activeIntent, setActiveIntent] = useState<string | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
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
                content = await parsePdfToHtml(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                content = result.value;
            } else {
                throw new Error('Unsupported file type');
            }

            // Create new document
            const newDoc = await documentService.create(title, folderId);

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

    const { folderId, tagId } = useParams<{ folderId?: string; tagId?: string }>();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { currentWorkspaceId } = useWorkspaceStore();

    useEffect(() => {
        // Only show full loader on initial load or folder/tag/workspace change
        loadDocuments(true);
        // Clear secondary tag when URL primary filter changes? 
        // Or keep it? Let's clear for now to avoid confusion.
        setSecondaryTagId(null);
    }, [folderId, tagId, currentWorkspaceId]);

    useEffect(() => {
        // Soft reload for search or secondary tag
        if (!isLoading) {
            loadDocuments(false);
        }
    }, [debouncedSearchQuery, secondaryTagId]);

    const loadDocuments = async (showFullLoader = false) => {
        if (showFullLoader) setIsLoading(true);
        try {
            const docs = await documentService.getAll({
                search: searchQuery,
                folderId: folderId,
                tagId: tagId || secondaryTagId || undefined,
                workspaceId: currentWorkspaceId || undefined
            });
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to load documents", error);
        } finally {
            if (showFullLoader) setIsLoading(false);
        }
    };

    // Fetch active filter details
    useEffect(() => {
        const fetchFilterDetails = async () => {
            const filters: any[] = [];

            if (folderId) {
                try {
                    const folder = await folderService.getById(folderId);
                    filters.push({ type: 'folder', id: folder.id, name: folder.name, color: folder.color });
                } catch (e) {
                    console.error("Failed to fetch folder details", e);
                }
            }

            if (tagId) {
                try {
                    const tag = await tagService.getById(tagId);
                    filters.push({ type: 'tag', id: tag.id, name: tag.name, color: tag.color });
                } catch (e) {
                    console.error("Failed to fetch tag details", e);
                }
            } else if (secondaryTagId) {
                try {
                    const tag = await tagService.getById(secondaryTagId);
                    filters.push({ type: 'tag', id: tag.id, name: tag.name, color: tag.color });
                } catch (e) {
                    console.error("Failed to fetch secondary tag details", e);
                }
            }

            setActiveFilterDetails(filters);
        };

        fetchFilterDetails();
    }, [folderId, tagId, secondaryTagId]);

    const handleClearFilter = useCallback((type: 'folder' | 'tag', id: string) => {
        if (type === 'folder') {
            navigate('/');
        } else {
            if (tagId === id) {
                navigate('/');
            } else {
                setSecondaryTagId(null);
            }
        }
    }, [navigate, tagId]);

    const handleCreateDocument = useCallback(async (template?: DocumentTemplate) => {
        try {
            const title = template ? template.name : "Untitled Document";
            const newDoc = await documentService.create(title, folderId, currentWorkspaceId);

            if (template) {
                await documentService.update(newDoc.id, {
                    content: template.content,
                    intent: template.intent
                });
            }

            navigate(`/doc/${newDoc.id}`);
        } catch (error) {
            console.error("Failed to create document:", error);
        } finally {
            setIsTemplateModalOpen(false);
        }
    }, [folderId, currentWorkspaceId, navigate]);

    const handleDeleteClick = useCallback((id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, docId: id, title: title });
    }, []);

    const handleRenameClick = useCallback((docId: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameModal({ isOpen: true, docId, title });
    }, []);

    const handleMoveClick = useCallback((docId: string, title: string, currentFolderId?: string | null) => {
        setMoveModal({ isOpen: true, docId, title, folderId: currentFolderId });
    }, []);

    const confirmMove = useCallback(async (folderId: string | null) => {
        if (!moveModal.docId) return;
        try {
            await documentService.update(moveModal.docId, { folderId });
            loadDocuments();
        } catch (error) {
            console.error("Failed to move document", error);
        }
    }, [moveModal.docId]);

    const confirmDelete = useCallback(async () => {
        if (!deleteModal.docId) return;

        setIsDeleting(true);
        try {
            await documentService.delete(deleteModal.docId);
            setDocuments(prev => prev.filter(doc => doc.id !== deleteModal.docId));
            setDeleteModal({ isOpen: false, docId: null, title: "" });
        } catch (error) {
            console.error("Failed to delete document:", error);
        } finally {
            setIsDeleting(false);
        }
    }, [deleteModal.docId]);

    const confirmRename = useCallback(async (newTitle: string) => {
        if (!renameModal.docId) return;

        setIsRenaming(true);
        try {
            await documentService.update(renameModal.docId, { title: newTitle });
            setDocuments(prev => prev.map(doc =>
                doc.id === renameModal.docId ? { ...doc, title: newTitle } : doc
            ));
            setRenameModal({ isOpen: false, docId: null, title: "" });
        } catch (error) {
            console.error("Failed to rename document:", error);
        } finally {
            setIsRenaming(false);
        }
    }, [renameModal.docId]);

    // Filter documents based on search query and intent
    const filteredDocuments = documents?.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIntent = activeIntent ? doc.intent === activeIntent : true;
        return matchesSearch && matchesIntent;
    });

    // Documents to display
    const quickAccessDocs = filteredDocuments?.slice(0, 4);
    const displayDocs = showAll ? filteredDocuments : filteredDocuments?.slice(0, 5);

    if (isLoading || isUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 bg-opacity-60 dark:bg-[#121212]">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <DashboardLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilterDetails as any}
            onClearFilter={handleClearFilter}
            activeTagId={tagId || secondaryTagId}
            onSelectTag={(id) => {
                if (tagId) {
                    // If we are already on a tag page, navigate to the new tag or home
                    id ? navigate(`/tag/${id}`) : navigate('/');
                } else {
                    setSecondaryTagId(id);
                }
            }}
            activeIntent={activeIntent}
            onSelectIntent={setActiveIntent}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileImport}
            />
            {/* Header Section */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white animate-gradient-x">
                    Welcome back, {user?.username}
                </h1>
                <p className="text-gray-500 dark:text-zinc-400">
                    Here's what's been happening with your projects.
                </p>
            </div>

            {documents?.length === 0 ? (
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
                            onClick={() => setIsTemplateModalOpen(true)}
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
                    <WorkspaceAnalytics workspaceId={currentWorkspaceId || ""} />
                    <WorkspaceIntelligence documents={documents} />
                    {/* Quick Access Grid */}
                    <section className="my-8">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-6">
                            Quick Access
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {!quickAccessDocs || quickAccessDocs.length === 0 ? (
                                <div className="col-span-full py-8 text-center text-gray-400 dark:text-zinc-500 italic">
                                    No recent documents found matching "{searchQuery}"
                                </div>
                            ) : (
                                quickAccessDocs.map((doc, index) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <DocumentCard
                                            id={doc.id}
                                            title={doc.title}
                                            lastEdited={new Date(doc.updatedAt).toLocaleDateString()}
                                            tags={doc.tags}
                                            onClick={() => navigate(`/doc/${doc.id}`)}
                                            onDelete={() => handleDeleteClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                            onRename={() => handleRenameClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                            onMove={() => handleMoveClick(doc.id, doc.title, doc.folderId)}
                                            intent={doc.intent}
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
                                {filteredDocuments?.length > 5 && (
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
                                <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider rounded-t-2xl">
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
                                                transition={{ delay: 0.2 + (index * 0.05) }}
                                            >
                                                <DocumentRow
                                                    id={doc.id}
                                                    title={doc.title}
                                                    owner={doc.owner}
                                                    lastEdited={new Date(doc.updatedAt).toLocaleDateString()}
                                                    tags={doc.tags}
                                                    onClick={() => navigate(`/doc/${doc.id}`)}
                                                    onDelete={() => handleDeleteClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                                    onRename={() => handleRenameClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                                    onMove={() => handleMoveClick(doc.id, doc.title, doc.folderId)}
                                                    intent={doc.intent}
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
                                            transition={{ delay: 0.2 + (index * 0.05) }}
                                        >
                                            <DocumentCard
                                                id={doc.id}
                                                title={doc.title}
                                                lastEdited={new Date(doc.updatedAt).toLocaleDateString()}
                                                tags={doc.tags}
                                                onClick={() => navigate(`/doc/${doc.id}`)}
                                                onDelete={() => handleDeleteClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                                onRename={() => handleRenameClick(doc.id, doc.title, { stopPropagation: () => { } } as any)}
                                                onMove={() => handleMoveClick(doc.id, doc.title, doc.folderId)}
                                                intent={doc.intent}
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
                documents?.length > 0 && (
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
                            onClick={() => {
                                console.log("CLICK: Opening Template Modal");
                                setIsTemplateModalOpen(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-4 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 text-white hover:shadow-indigo-500/50 transition-shadow cursor-pointer"
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
                type="document"
            />

            <MoveToFolderModal
                isOpen={moveModal.isOpen}
                onClose={() => setMoveModal({ ...moveModal, isOpen: false })}
                documentTitle={moveModal.title}
                currentFolderId={moveModal.folderId}
                onMove={confirmMove}
            />

            <TemplateGalleryModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                onSelect={handleCreateDocument}
            />
        </DashboardLayout >
    );
}
