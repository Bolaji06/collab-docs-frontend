import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft, Cloud, Check, Loader, Download, ChevronDown, Lock, Share2, MessageSquare, BarChart3, Sparkles,
    Brain, Scale, FileText, Rocket, Target
} from "lucide-react";

import { AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../ThemeToggle";
import { TiptapEditor } from "./TiptapEditor";
import { ErrorBoundary } from "../ErrorBoundary";
import { documentService } from "../../services/document-service";
import PremiumModal from "../PremiumModal";
import { ShareDialog } from "../ShareDialog";
import { TagSelector } from "./TagSelector";
import { useUserStore } from "../../store/useUserStore";
import { commentService } from "../../services/comment-service";
import { CommentSidebar } from "./CommentSidebar";
import { CommentInputDialog } from "./CommentInputDialog";
import { DocumentStats } from "./DocumentStats";
import { PageSettings } from "./PageSettings";

import { Layout } from "lucide-react";
import { AISidebar } from "./AISidebar";
import { AsyncDigest } from "./AsyncDigest";
import { DocumentDashboard } from "./DocumentDashboard";
import { notificationService } from "../../services/notification-service";



export default function DocumentWorkspace() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore();

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
    const [showStats, setShowStats] = useState(false);
    const [currentContent, setCurrentContent] = useState("");
    const [showPageSettings, setShowPageSettings] = useState(false);
    const [pageSettings, setPageSettings] = useState<any>({
        width: 'standard',
        background: 'white',
        fontSize: 'base'
    });
    const [showAISidebar, setShowAISidebar] = useState(false);
    const [showAsyncDigest, setShowAsyncDigest] = useState(true);
    const [intent, setIntent] = useState<'brainstorming' | 'decision' | 'documentation' | 'execution'>('documentation');
    const [showDashboard, setShowDashboard] = useState(false);




    const isPremiumUser = user?.isPremium || false;
    const COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

    const getUserColor = (email: string | undefined) => {
        if (!email) return COLORS[0];
        const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % COLORS.length;
        return COLORS[index];
    };

    const currentUser = useMemo(() => {
        if (!user) return null;
        return {
            name: user.username || user.email.split('@')[0],
            color: getUserColor(user.email),
            avatar: user.avatar,
            email: user.email
        };
    }, [user]);

    const defaultUser = useMemo(() => ({
        name: 'Anonymous',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        avatar: undefined,
        email: ''
    }), []);

    const isInitialLoad = useRef(true);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadDocument = async (docId: string) => {
        try {
            const response = await documentService.getById(docId);
            setDocument(response);
            setTitle(response.title);
        } catch (error) {
            console.error("Failed to load document", error);
            navigate("/");
        }
    };

    useEffect(() => {
        if (!id) return;
        const init = async () => {
            await loadDocument(id);
            setIsLoading(false);
            isInitialLoad.current = false;
        };
        init();

        // Load intent
        const savedIntent = localStorage.getItem(`collabdocs_intent_${id}`);
        if (savedIntent) setIntent(savedIntent as any);

        // Track last visit
        return () => {
            localStorage.setItem(`collabdocs_last_visit_${id}`, Date.now().toString());
        };
    }, [id]);

    const handleIntentChange = (newIntent: any) => {
        setIntent(newIntent);
        localStorage.setItem(`collabdocs_intent_${id}`, newIntent);
    };

    const canEdit = useMemo(() => {
        if (!document || !user) return false;
        const userId = (user as any).id;
        if (document.ownerId === userId) return true;
        const userPermission = document.permissions?.find((p: any) =>
            p.userId === userId || p.user?.email === user.email
        );
        return userPermission?.role === 'EDITOR';
    }, [document, user]);

    const mentionableUsers = useMemo(() => {
        if (!canEdit || !document) return [];
        const users = document.permissions?.map((p: any) => ({
            id: p.user.id,
            name: p.user.username || p.user.email.split('@')[0],
            avatar: p.user.avatar,
            email: p.user.email
        })) || [];

        if (document.owner) {
            users.push({
                id: document.ownerId,
                name: document.owner.username || document.owner.email.split('@')[0],
                avatar: document.owner.avatar,
                email: document.owner.email
            });
        }
        return users.filter((v: any, i: any, a: any) => a.findIndex((t: any) => (t.email === v.email)) === i);
    }, [canEdit, document]);

    const handleContentChange = useCallback((newContent: string) => {
        setCurrentContent(newContent);
        if (isInitialLoad.current || !id || !canEdit) return;
        setSaveStatus("saving");
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await documentService.update(id, { content: newContent });
                setSaveStatus("saved");
            } catch (error) {
                console.error("Failed to save content", error);
                setSaveStatus("error");
            }
        }, 2000);
    }, [id, canEdit]);

    const handleTagsChange = () => {
        if (id) loadDocument(id);
    };

    const handlePremiumDownload = (format: string) => {
        if (!isPremiumUser) {
            setShowPremiumModal(true);
            return;
        }
        handleDownload(format);
    };

    const handleDownload = async (format: string) => {
        console.log(`Downloading as ${format}...`);
        setShowDownloadMenu(false);
    };

    const handleAddComment = () => setShowCommentInput(true);
    const handleCommentSubmit = async (content: string) => {
        if (!id || !content.trim() || !editor) return;

        // Capture current selection for the API
        const { from, to } = editor.state.selection;

        try {
            const comment = await commentService.create(id, content, from, to);

            if (comment && comment.id) {
                // Apply the mark to the editor
                editor.commands.setComment(comment.id);

                setCommentRefreshTrigger(prev => prev + 1);
                setShowCommentInput(false);
            }
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };
    const handleCommentClick = (commentId: string) => {
        setActiveCommentId(commentId);
        setShowComments(true);
    };

    const handleJumpTo = (pos: number) => {
        if (!editor) return;
        editor.chain().focus(pos).run();

        // Scroll to the element
        const element = editor.view.nodeDOM(pos);
        if (element instanceof HTMLElement) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setShowDashboard(false);
    };

    const handleSendNudge = async (waitingUsers: any[]) => {
        if (!id || !title) return;
        try {
            await notificationService.sendNudge({
                userIds: waitingUsers.map(u => u.id),
                documentId: id,
                documentTitle: title
            });
            alert("Nudge sent to missing collaborators!");
        } catch (error) {
            console.error("Failed to send nudge", error);
        }
    };


    if (isLoading) {

        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#121212]">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!document) return null;

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-[#121212]">
            <header className="h-16 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
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
                            {saveStatus === "saving" && <><Cloud className="w-3 h-3 animate-pulse" /><span>Saving...</span></>}
                            {saveStatus === "saved" && <><Check className="w-3 h-3" /><span>Saved to cloud</span></>}
                            {saveStatus === "error" && <span className="text-red-500">Error saving</span>}
                            {!canEdit && <span className="text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> View Only</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={() => handleIntentChange('brainstorming')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${intent === 'brainstorming' ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Brainstorming Mode"
                    >
                        <Brain className="w-3.5 h-3.5" /> <span className="hidden md:inline">Brainstorm</span>
                    </button>
                    <button
                        onClick={() => handleIntentChange('decision')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${intent === 'decision' ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Decision Review Mode"
                    >
                        <Scale className="w-3.5 h-3.5" /> <span className="hidden md:inline">Decide</span>
                    </button>
                    <button
                        onClick={() => handleIntentChange('documentation')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${intent === 'documentation' ? 'bg-white dark:bg-zinc-700 shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Documentation Mode"
                    >
                        <FileText className="w-3.5 h-3.5" /> <span className="hidden md:inline">Document</span>
                    </button>
                    <button
                        onClick={() => handleIntentChange('execution')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${intent === 'execution' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Execution Mode"
                    >
                        <Rocket className="w-3.5 h-3.5" /> <span className="hidden md:inline">Execute</span>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 overflow-hidden ml-2">
                        {document.tags?.map((t: any, idx: number) => (
                            <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                                style={{
                                    backgroundColor: t.tag.color ? `${t.tag.color}20` : '#8B5CF620',
                                    color: t.tag.color || '#8B5CF6'
                                }}
                            >
                                {t.tag.name}
                            </span>
                        ))}
                    </div>

                    <TagSelector
                        documentId={id!}
                        currentTags={document.tags || []}
                        onTagsChange={handleTagsChange}
                    />

                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
                    <div className="flex -space-x-2">
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs text-white font-medium overflow-hidden"
                            style={{ backgroundColor: currentUser?.color || COLORS[0] }}
                        >
                            {currentUser?.avatar ? <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" /> : currentUser?.name?.substring(0, 2).toUpperCase() || 'AN'}
                        </div>
                    </div>

                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`p-2 rounded-lg transition-all ${showStats
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-inner'
                            : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                        title="Document Stats"
                    >
                        <BarChart3 className={`w-5 h-5 ${showStats ? 'animate-pulse' : ''}`} />
                    </button>
                    <div className="relative page-settings-container">
                        <button
                            onClick={() => setShowPageSettings(!showPageSettings)}
                            className={`p-2 rounded-lg transition-all ${showPageSettings
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-inner'
                                : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                }`}
                            title="Page Layout"
                        >
                            <Layout className="w-5 h-5" />
                        </button>
                        {showPageSettings && (
                            <div className="absolute right-0 mt-2 z-50">
                                <PageSettings
                                    settings={pageSettings}
                                    onUpdate={setPageSettings}
                                />
                            </div>
                        )}
                    </div>
                    <ThemeToggle />

                    <div className="relative download-menu-container">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Download <ChevronDown className="w-3 h-3" />
                        </button>
                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                                <button onClick={() => handlePremiumDownload('docx')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 first:rounded-t-lg transition-colors flex items-center justify-between group">
                                    <span>Download as DOCX</span>
                                    {!isPremiumUser && <Lock className="w-3 h-3 text-amber-500" />}
                                </button>
                                <button onClick={() => handlePremiumDownload('pdf')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-between group">
                                    <span>Download as PDF</span>
                                    {!isPremiumUser && <Lock className="w-3 h-3 text-amber-500" />}
                                </button>
                                <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
                                <button onClick={() => handleDownload('html')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">Download as HTML</button>
                                <button onClick={() => handleDownload('markdown')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">Download as Markdown</button>
                                <button onClick={() => handleDownload('txt')} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 last:rounded-b-lg transition-colors">Download as Text</button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowShareDialog(true)}
                        disabled={!canEdit}
                        className={`px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Share2 className="w-4 h-4" /> Share
                    </button>

                    <button
                        onClick={() => {
                            setShowComments(!showComments);
                            if (!showComments) setShowAISidebar(false);
                        }}
                        className={`p-2 rounded-lg transition-colors ${showComments ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        title="Comments"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => {
                            setShowAISidebar(!showAISidebar);
                            if (!showAISidebar) setShowComments(false);
                        }}
                        className={`p-2 rounded-lg transition-colors ${showAISidebar ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        title="AI Assistant"
                    >
                        <Sparkles className={`w-5 h-5 ${showAISidebar ? 'animate-pulse' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowDashboard(!showDashboard)}
                        className={`p-2 rounded-lg transition-all ${showDashboard ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        title="Priority Board"
                    >
                        <Target className="w-5 h-5 font-bold" />
                    </button>
                </div>
            </header>

            <main className={`flex-1 relative transition-all duration-300 ${(showComments || showAISidebar) ? 'mr-[400px]' : ''}`}>
                <ErrorBoundary>
                    <TiptapEditor
                        key={document.id}
                        content={document.content || ""}
                        onChange={handleContentChange}
                        documentId={document.id}
                        user={currentUser || defaultUser}
                        editable={canEdit}
                        onEditorReady={setEditor}
                        onAddComment={handleAddComment}
                        onCommentClick={handleCommentClick}
                        mentionableUsers={mentionableUsers}
                        pageSettings={pageSettings}
                    />
                </ErrorBoundary>

                {showAsyncDigest && editor && (
                    <div className="fixed bottom-8 right-8 z-50 w-[380px]">
                        <AsyncDigest
                            editor={editor}
                            documentId={id!}
                            intent={intent}
                            onClose={() => setShowAsyncDigest(false)}
                        />
                    </div>
                )}

                <AnimatePresence>
                    {showStats && (
                        <div className="fixed right-6 top-32 z-40 w-80">
                            <DocumentStats content={currentContent || document.content || ""} />
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showComments && (
                        <CommentSidebar
                            documentId={document.id}
                            editor={editor}
                            isOpen={showComments}
                            onClose={() => setShowComments(false)}
                            refreshTrigger={commentRefreshTrigger}
                            activeCommentId={activeCommentId}
                            intent={intent}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showAISidebar && (
                        <AISidebar
                            documentId={document.id}
                            documentContent={document.content ? JSON.stringify(document.content) : ""}
                            editor={editor}
                            intent={intent}
                            onClose={() => setShowAISidebar(false)}
                        />
                    )}
                </AnimatePresence>

                <CommentInputDialog
                    isOpen={showCommentInput}
                    onClose={() => setShowCommentInput(false)}
                    onSubmit={handleCommentSubmit}
                />
            </main>

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

            {showPremiumModal && <PremiumModal setShowPremiumModal={setShowPremiumModal} />}

            {showDashboard && (
                <DocumentDashboard
                    editor={editor}
                    onClose={() => setShowDashboard(false)}
                    onJumpTo={handleJumpTo}
                    onSendNudge={handleSendNudge}
                    mentionableUsers={mentionableUsers}
                />
            )}
        </div>
    );
}
