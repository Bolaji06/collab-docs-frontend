
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud, Check, Loader, Download, ChevronDown, Lock, Share2, MessageSquare } from "lucide-react"; // Added Share2
import { Link } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";
import { TiptapEditor } from "./TiptapEditor";
import { ErrorBoundary } from "../ErrorBoundary";
import { documentService } from "../../services/document-service";
import PremiumModal from "../PremiumModal";
import { ShareDialog } from "../ShareDialog";
import { useUserStore } from "../../store/useUserStore";
import { commentService } from "../../services/comment-service";
import { CommentSidebar } from "./CommentSidebar";
import { CommentInputDialog } from "./CommentInputDialog";

export default function DocumentWorkspace() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
    const [editor, setEditor] = useState<any>(null);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    // TODO: Replace with actual user premium status from auth context
    const isPremiumUser = false; // Set to true for premium users

    const { user } = useUserStore();

    const currentUser = useMemo(() => {
        if (!user) return null;
        return {
            name: user.username || user.email.split('@')[0],
            color: user.avatar || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
            email: user.email
        };
    }, [user]);

    const defaultUser = useMemo(() => ({
        name: 'Anonymous',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        email: ''
    }), []);

    // Use a ref to track if it's the initial load to prevent overwriting with old state
    const isInitialLoad = useRef(true);

    // Debounce timer ref
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!id) return;

        const init = async () => {
            await Promise.all([loadDocument(id)]);
            setIsLoading(false);
            isInitialLoad.current = false;
        };
        init();
    }, [id]);

    const loadDocument = async (docId: string) => {
        try {
            const doc = await documentService.getById(docId);
            setDocument(doc);
            setTitle(doc.title);
        } catch (error) {
            console.error("Failed to load document", error);
            navigate("/"); // Redirect to dashboard on error
        }
    };

    // Check permissions
    const canEdit = useMemo(() => {
        if (!document || !user) return false;
        // user.id might be missing from type but present in runtime, we need to fix type
        if (document.ownerId === (user as any).id) return true;

        // Find user's permission
        const userPermission = document.permissions?.find((p: any) =>
            p.userId === (user as any).id || p.user?.email === user.email
        );

        return userPermission?.role === 'EDITOR';
    }, [document, user]);

    const mentionableUsers = useMemo(() => {
        if (!canEdit || !document) return [];

        const users = document.permissions?.map((p: any) => ({
            name: p.user.username || p.user.email.split('@')[0],
            avatar: p.user.avatar,
            email: p.user.email
        })) || [];

        if (document.owner) {
            users.push({
                name: document.owner.username || document.owner.email.split('@')[0],
                avatar: document.owner.avatar,
                email: document.owner.email
            });
        }

        // De-duplicate by email
        return users.filter((v: any, i: any, a: any) => a.findIndex((t: any) => (t.email === v.email)) === i);
    }, [canEdit, document]);

    const handleContentChange = useCallback((newContent: string) => {
        if (isInitialLoad.current || !id || !canEdit) return;

        setSaveStatus("saving");

        // Debounce save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await documentService.update(id, { content: newContent });
                setSaveStatus("saved");
            } catch (error) {
                console.error("Failed to save content", error);
                setSaveStatus("error");
            }
        }, 2000); // Save after 1 second of inactivity
    }, [id, canEdit]);

    // const handleTitleChange = async (newTitle: string) => {
    //     setTitle(newTitle);
    //     if (!id || !canEdit) return;

    //     setSaveStatus("saving");

    //     if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    //     saveTimeoutRef.current = setTimeout(async () => {
    //         try {
    //             await documentService.update(id, { title: newTitle });
    //             setSaveStatus("saved");
    //         } catch (error) {
    //             console.error("Failed to save title", error);
    //             setSaveStatus("error");
    //         }
    //     }, 1000);
    // };

    const handleAddComment = () => {
        if (!editor) return;
        if (editor.state.selection.empty) {
            alert("Please select some text to comment on.");
            return;
        }
        setShowCommentInput(true);
    };

    const handleCommentSubmit = async (content: string) => {
        if (!editor || !content) return;

        try {
            const { from, to } = editor.state.selection;
            const response = await commentService.create(id!, content, from, to);

            if (response.data) {
                editor.chain().focus().setComment(response.data.id).run();
                setCommentRefreshTrigger(prev => prev + 1);
                setShowComments(true);
            }
        } catch (error) {
            console.error("Failed to add comment", error);
            alert("Failed to add comment");
        }
    };

    const handleCommentClick = (commentId: string) => {
        setActiveCommentId(commentId);
        setShowComments(true);
    };

    const handlePremiumDownload = (format: 'docx' | 'pdf') => {
        if (!isPremiumUser) {
            setShowPremiumModal(true);
            setShowDownloadMenu(false);
            return;
        }
        handleDownload(format);
    };

    const handleDownload = async (format: 'html' | 'markdown' | 'txt' | 'docx' | 'pdf') => {
        if (!document) return;

        let content = '';
        let mimeType = '';
        let extension = '';

        switch (format) {
            case 'html':
                content = document.content as string || '';
                mimeType = 'text/html';
                extension = 'html';
                break;
            case 'markdown':
                // Convert HTML to Markdown (basic conversion)
                const tempDiv = window.document.createElement('div');
                tempDiv.innerHTML = document.content as string || '';
                content = tempDiv.textContent || '';
                mimeType = 'text/markdown';
                extension = 'md';
                break;
            case 'txt':
                const textDiv = window.document.createElement('div');
                textDiv.innerHTML = document.content as string || '';
                content = textDiv.textContent || '';
                mimeType = 'text/plain';
                extension = 'txt';
                break;
            case 'docx':
                try {
                    // Note: This export logic seems incomplete as it doesn't use content for the actual file generation
                    // checking for html-docx-js or similar usage in future
                    const a = window.document.createElement('a');
                    a.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    a.download = `${title || 'document'}.docx`;
                    window.document.body.appendChild(a);
                    a.click();
                    window.document.body.removeChild(a);
                    setShowDownloadMenu(false);
                    return;
                } catch (error) {
                    console.error('Failed to generate DOCX:', error);
                    alert(`Failed to generate DOCX file: ${error instanceof Error ? error.message : 'Unknown error'} `);
                    setShowDownloadMenu(false);
                    return;
                }
            case 'pdf':
                try {
                    const jsPDFModule = await import('jspdf');
                    const { jsPDF } = jsPDFModule;
                    const html2canvas = (await import('html2canvas')).default;

                    // Create a temporary div with the content
                    const tempContainer = window.document.createElement('div');
                    tempContainer.innerHTML = document.content as string || '';
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.width = '800px';
                    tempContainer.style.padding = '40px';
                    tempContainer.style.backgroundColor = 'white';
                    tempContainer.style.color = 'black';
                    tempContainer.style.fontFamily = 'Arial, sans-serif';
                    tempContainer.style.fontSize = '14px';
                    tempContainer.style.lineHeight = '1.6';
                    window.document.body.appendChild(tempContainer);

                    const canvas = await html2canvas(tempContainer, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });

                    window.document.body.removeChild(tempContainer);

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const imgWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(`${title || 'document'}.pdf`);
                    setShowDownloadMenu(false);
                    return;
                } catch (error) {
                    console.error('Failed to generate PDF:', error);
                    alert(`Failed to generate PDF file: ${error instanceof Error ? error.message : 'Unknown error'} `);
                    setShowDownloadMenu(false);
                    return;
                }
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${title || 'document'}.${extension} `;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
    };



    // Close download menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showDownloadMenu && !target.closest('.download-menu-container')) {
                setShowDownloadMenu(false);
            }
        };

        window.document.addEventListener('mousedown', handleClickOutside);
        return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloadMenu]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <Loader className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!document) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212]">
            {/* Header */}
            <header className="h-16 px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between z-20">
                <div className="flex items-center gap-4 flex-1">
                    <Link
                        to="/"
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={!canEdit}
                            className={`text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 ${!canEdit ? 'opacity-70 cursor-default' : ''}`}
                            placeholder="Untitled Document"
                        />
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                            {saveStatus === "saving" && (
                                <>
                                    <Cloud className="w-3 h-3 animate-pulse" />
                                    <span>Saving...</span>
                                </>
                            )}
                            {saveStatus === "saved" && (
                                <>
                                    <Check className="w-3 h-3" />
                                    <span>Saved to cloud</span>
                                </>
                            )}
                            {saveStatus === "error" && (
                                <span className="text-red-500">Error saving</span>
                            )}
                            {!canEdit && (
                                <span className="text-gray-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> View Only
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs text-white font-medium">
                            {currentUser?.name?.substring(0, 2).toUpperCase() || 'AN'}
                        </div>
                    </div>
                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
                    <ThemeToggle />

                    {/* Download Button */}
                    <div className="relative download-menu-container">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                            <ChevronDown className="w-3 h-3" />
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                                <button
                                    onClick={() => handlePremiumDownload('docx')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 first:rounded-t-lg transition-colors flex items-center justify-between group"
                                >
                                    <span>Download as DOCX</span>
                                    {!isPremiumUser && <Lock className="w-3 h-3 text-amber-500" />}
                                </button>
                                <button
                                    onClick={() => handlePremiumDownload('pdf')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between group"
                                >
                                    <span>Download as PDF</span>
                                    {!isPremiumUser && <Lock className="w-3 h-3 text-amber-500" />}
                                </button>
                                <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
                                <button
                                    onClick={() => handleDownload('html')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Download as HTML
                                </button>
                                <button
                                    onClick={() => handleDownload('markdown')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Download as Markdown
                                </button>
                                <button
                                    onClick={() => handleDownload('txt')}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 last:rounded-b-lg transition-colors"
                                >
                                    Download as Text
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowShareDialog(true)}
                        disabled={!canEdit}
                        className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`p-2 rounded-lg transition-colors ${showComments ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        title="Comments"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Editor Canvas */}
            <main className={`flex-1 relative transition-all duration-300 ${showComments ? 'mr-80' : ''}`}>
                <ErrorBoundary>
                    <TiptapEditor
                        key={document.id}
                        content={
                            (document.content && Object.keys(document.content as object).length > 0)
                                ? document.content as any
                                : ""
                        }
                        onChange={handleContentChange}
                        documentId={document.id}
                        user={currentUser || defaultUser}
                        editable={canEdit}
                        onEditorReady={setEditor}
                        onAddComment={handleAddComment}
                        onCommentClick={handleCommentClick}
                        mentionableUsers={mentionableUsers}
                    />
                </ErrorBoundary>

                {document && (
                    <CommentSidebar
                        documentId={document.id}
                        editor={editor}
                        isOpen={showComments}
                        onClose={() => setShowComments(false)}
                        refreshTrigger={commentRefreshTrigger}
                        activeCommentId={activeCommentId}
                    />
                )}

                {/* Comment Input Dialog */}
                <CommentInputDialog
                    isOpen={showCommentInput}
                    onClose={() => setShowCommentInput(false)}
                    onSubmit={handleCommentSubmit}
                />
            </main>

            {/* Share Dialog */}
            {document && (
                <ShareDialog
                    open={showShareDialog}
                    onClose={() => setShowShareDialog(false)}
                    documentId={document.id}
                    permissions={document.permissions || []}
                    onPermissionsChange={() => loadDocument(document.id)}
                    currentUserEmail={currentUser?.email}
                    ownerEmail={document.owner?.email}
                    isPublic={document.isPublic}
                    publicRole={document.publicRole}
                />
            )}

            {/* Premium Upgrade Modal */}
            {showPremiumModal && (
                <PremiumModal setShowPremiumModal={setShowPremiumModal} />
            )}
        </div>
    );
}
