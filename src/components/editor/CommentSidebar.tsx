
import { useEffect, useState } from "react";
import { commentService, type Comment } from "../../services/comment-service";
import { Loader, Send, CheckCircle, X, Plus, Sparkles, Target, ListTodo, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Editor } from "@tiptap/react";
import { clsx } from 'clsx';
import { useUserStore } from "../../store/useUserStore";

interface CommentSidebarProps {
    documentId: string;
    editor: Editor | null;
    isOpen: boolean;
    onClose: () => void;
    refreshTrigger: number;
    activeCommentId?: string | null;
    intent: string;
}

export function CommentSidebar({ documentId, editor, isOpen, onClose, refreshTrigger, activeCommentId, intent }: CommentSidebarProps) {
    const { user: currentUser } = useUserStore();
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [replyText, setReplyText] = useState<Record<string, string>>({});
    const [showResolved, setShowResolved] = useState(false);
    //const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [showOutcomePicker, setShowOutcomePicker] = useState<string | null>(null);

    const THREAD_STAGNATION_THRESHOLD = 4;

    const EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '🚀'];

    useEffect(() => {
        if (isOpen && documentId) {
            loadComments();
        }
    }, [documentId, isOpen, refreshTrigger]);

    // Scroll to active comment when it changes
    useEffect(() => {
        if (activeCommentId) {
            const element = document.getElementById(`comment-${activeCommentId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: add a temporary highlight effect
                element.classList.add('ring-2', 'ring-indigo-500');
                setTimeout(() => element.classList.remove('ring-2', 'ring-indigo-500'), 2000);
            }
        }
    }, [activeCommentId, comments]);

    const loadComments = async () => {
        setIsLoading(true);
        try {
            const allComments = await commentService.getAll(documentId);
            setComments(allComments);
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async (commentId: string) => {
        const text = replyText[commentId];
        if (!text?.trim()) return;

        try {
            await commentService.reply(commentId, text);
            setReplyText(prev => ({ ...prev, [commentId]: "" }));
            loadComments(); // Refresh to show new reply
        } catch (error) {
            console.error("Failed to reply", error);
        }
    };

    const handleResolve = async (commentId: string, outcome?: string) => {
        // Intent Rail: In decision mode, block resolution if there are unacknowledged risks
        if (intent === 'decision' && editor) {
            const risks: any[] = [];
            editor.state.doc.descendants((node: any) => {
                if (node.type.name === 'collaborationBlock' && node.attrs.type === 'risk') {
                    const isAcknowledged = node.attrs.acknowledgments && node.attrs.acknowledgments.length > 0;
                    if (!isAcknowledged) risks.push(node.attrs);
                }
            });

            if (risks.length > 0) {
                alert("Cannot resolve discussions in DECIDE mode while there are unacknowledged Risk blocks. Address the team health first.");
                return;
            }
        }

        try {
            await commentService.resolve(commentId, outcome);
            if (!showResolved && editor) {
                removeCommentMark(commentId);
            }

            setShowOutcomePicker(null);
            loadComments();
        } catch (error) {
            console.error("Failed to resolve", error);
        }
    };

    const handleConvertToDecision = (comment: Comment) => {
        if (!editor) return;

        // 1. Resolve the comment
        handleResolve(comment.id, 'DECIDED');

        // 2. Insert decision block
        editor.chain().focus().setCollaborationBlock({
            type: 'decision',
            status: 'proposed'
        }).run();
    };

    const handleConvertToTask = (comment: Comment) => {
        if (!editor) return;

        // 1. Resolve the comment
        handleResolve(comment.id, 'DECIDED');

        // 2. Insert task block
        editor.chain().focus().setCollaborationBlock({
            type: 'task',
            status: 'proposed'
        }).run();
    };

    const handleUnresolve = async (commentId: string) => {
        try {
            await commentService.unresolve(commentId);
            loadComments();
        } catch (error) {
            console.error("Failed to unresolve", error);
        }
    };

    const handleToggleReaction = async (commentId: string, emoji: string) => {
        try {
            await commentService.toggleReaction(commentId, emoji);
            loadComments();
        } catch (error) {
            console.error("Failed to toggle reaction", error);
        }
    };

    const removeCommentMark = (commentId: string) => {
        if (!editor) return;
        const { doc } = editor.state;
        let tr = editor.state.tr;
        let hasChange = false;

        doc.descendants((node, pos) => {
            const mark = node.marks.find(m => m.type.name === 'comment' && m.attrs.commentId === commentId);
            if (mark) {
                tr = tr.removeMark(pos, pos + node.nodeSize, mark);
                hasChange = true;
            }
        });

        if (hasChange) {
            editor.view.dispatch(tr);
        }
    };

    const scrollToComment = (commentId: string) => {
        if (!editor) return;

        // Find mark location
        let found = false;
        editor.state.doc.descendants((node, pos) => {
            if (found) return false;
            const mark = node.marks.find(m => m.type.name === 'comment' && m.attrs.commentId === commentId);
            if (mark) {
                editor.commands.setTextSelection({ from: pos, to: pos + node.nodeSize });
                editor.commands.scrollIntoView();
                found = true;
                return false;
            }
        });
    };

    if (!isOpen) return null;

    const filteredComments = comments.filter(c => showResolved ? c.resolved : !c.resolved);

    return (
        <div className="w-[400px] border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full shadow-xl fixed right-0 top-0 z-40 pt-16">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Comments</h3>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                        {comments.filter(c => !c.resolved).length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowResolved(!showResolved)}
                        className={clsx(
                            "p-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1",
                            showResolved ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700"
                        )}
                        title={showResolved ? "Show unresolved" : "Show resolved"}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {showResolved ? "Reviewing" : ""}
                    </button>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                ) : filteredComments.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12 px-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">
                            {showResolved ? "No resolved comments yet." : "No active comments."}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {showResolved ? "" : "Select text to start a conversation."}
                        </p>
                    </div>
                ) : (
                    filteredComments.map(comment => (
                        <div
                            key={comment.id}
                            id={`comment-${comment.id}`}
                            onClick={() => !comment.resolved && scrollToComment(comment.id)}
                            className={clsx(
                                "border rounded-xl p-4 space-y-3 transition-all duration-300 group relative",
                                comment.id === activeCommentId
                                    ? "border-indigo-500 shadow-md ring-1 ring-indigo-500 ring-opacity-50"
                                    : "border-gray-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-zinc-700",
                                comment.resolved ? "bg-gray-50/50 dark:bg-zinc-950/20 grayscale-[0.5]" : "bg-white dark:bg-zinc-900",
                                !comment.resolved && "cursor-pointer"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 uppercase overflow-hidden">
                                        {comment.user.avatar ? (
                                            <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            comment.user.username[0]
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 block leading-tight">
                                            {comment.user.username}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {comment.resolved ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUnresolve(comment.id); }}
                                            className="p-1 px-2 text-[10px] font-bold bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-md hover:bg-green-100 transition-colors"
                                        >
                                            REOPEN
                                        </button>
                                    ) : (
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowOutcomePicker(showOutcomePicker === comment.id ? null : comment.id); }}
                                                className={clsx(
                                                    "p-1.5 rounded-md transition-colors flex items-center gap-1",
                                                    showOutcomePicker === comment.id ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                )}
                                                title="Resolve with outcome"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <ChevronDown className="w-3 h-3" />
                                            </button>

                                            {showOutcomePicker === comment.id && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 shadow-2xl border border-gray-100 dark:border-zinc-700 rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                                                    <div className="px-3 py-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-zinc-700/50 mb-1">
                                                        Select Outcome
                                                    </div>
                                                    <button onClick={() => handleResolve(comment.id, 'DECIDED')} className="w-full px-4 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Decided
                                                    </button>
                                                    <button onClick={() => handleResolve(comment.id, 'DEFERRED')} className="w-full px-4 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500" /> Deferred
                                                    </button>
                                                    <button onClick={() => handleResolve(comment.id, 'REJECTED')} className="w-full px-4 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-500" /> Rejected
                                                    </button>
                                                    <div className="border-t border-gray-50 dark:border-zinc-700/50 mt-1 pt-1">
                                                        <button onClick={() => handleResolve(comment.id)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-700 opacity-60 italic">
                                                            Just Resolve
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed pl-1">
                                {comment.content}
                            </p>

                            {/* Convergence Suggestion */}
                            {!comment.resolved && comment.replies.length >= THREAD_STAGNATION_THRESHOLD && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/50 space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Converge Discussion</span>
                                    </div>
                                    <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 italic leading-snug">
                                        This thread is getting long. Should we formalize an outcome?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleConvertToDecision(comment); }}
                                            className="flex-1 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                            <Target className="w-3 h-3" /> Decision
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleConvertToTask(comment); }}
                                            className="flex-1 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-600 hover:text-white transition-all"
                                        >
                                            <ListTodo className="w-3 h-3" /> Task
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Resolver Info */}
                            {comment.resolved && (
                                <div className="flex flex-col gap-1 pl-1">
                                    {comment.outcome && (
                                        <div className="flex items-center gap-1.5">
                                            <span className={clsx(
                                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                                                comment.outcome === 'DECIDED' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                                                comment.outcome === 'DEFERRED' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                                                comment.outcome === 'REJECTED' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            )}>
                                                {comment.outcome}
                                            </span>
                                        </div>
                                    )}
                                    {comment.resolver && (
                                        <div className="text-[10px] text-gray-400 italic flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            Resolved by {comment.resolver.username}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reactions */}
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50 dark:border-zinc-800/50" onClick={e => e.stopPropagation()}>
                                {Object.entries(
                                    comment.reactions.reduce((acc, r) => {
                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([emoji, count]) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleToggleReaction(comment.id, emoji)}
                                        className={clsx(
                                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium transition-all",
                                            comment.reactions.some(r => r.emoji === emoji && r.userId === currentUser?.id)
                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-500/20"
                                                : "bg-gray-50 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-gray-100"
                                        )}
                                    >
                                        <span>{emoji}</span>
                                        <span className="text-[10px]">{count}</span>
                                    </button>
                                ))}

                                {!comment.resolved && (
                                    <div className="relative group/emojis">
                                        <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="absolute bottom-full left-0 mb-2 p-1 bg-white dark:bg-zinc-800 shadow-xl border border-gray-100 dark:border-zinc-700 rounded-lg flex gap-1 items-center opacity-0 invisible group-hover/emojis:opacity-100 group-hover/emojis:visible transition-all z-10 scale-95 group-hover/emojis:scale-100">
                                            {EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleToggleReaction(comment.id, emoji)}
                                                    className="p-1.5 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded transition-colors text-sm"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                                <div className="space-y-3 pl-3 pt-2 border-l-2 border-indigo-50 dark:border-zinc-800">
                                    {comment.replies.map(reply => (
                                        <div key={reply.id} className="text-sm group/reply">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase overflow-hidden">
                                                    {reply.user.avatar ? (
                                                        <img src={reply.user.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        reply.user.username[0]
                                                    )}
                                                </div>
                                                <span className="font-semibold text-xs text-gray-900 dark:text-gray-200">{reply.user.username}</span>
                                                <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{formatDistanceToNow(new Date(reply.createdAt))} ago</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-zinc-400 leading-snug pl-7">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Input */}
                            {!comment.resolved && (
                                <div className="flex gap-2 items-center pt-2" onClick={e => e.stopPropagation()}>
                                    <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[10px] overflow-hidden">
                                        {currentUser?.avatar ? (
                                            <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser?.username?.[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Write a reply..."
                                            className="w-full text-xs py-1.5 pl-3 pr-8 rounded-full border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all"
                                            value={replyText[comment.id] || ""}
                                            onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleReply(comment.id);
                                            }}
                                        />
                                        <button
                                            onClick={() => handleReply(comment.id)}
                                            disabled={!replyText[comment.id]?.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-600 disabled:opacity-30 p-1"
                                        >
                                            <Send className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
