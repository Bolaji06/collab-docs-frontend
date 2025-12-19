
import { useEffect, useState } from "react";
import { commentService, type Comment } from "../../services/comment-service";
import { Loader, Send, CheckCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Editor } from "@tiptap/react";

interface CommentSidebarProps {
    documentId: string;
    editor: Editor | null;
    isOpen: boolean;
    onClose: () => void;
    refreshTrigger: number; // Increment to reload
    activeCommentId?: string | null;
}

export function CommentSidebar({ documentId, editor, isOpen, onClose, refreshTrigger, activeCommentId }: CommentSidebarProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [replyText, setReplyText] = useState<Record<string, string>>({});

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
            const response = await commentService.getAll(documentId);
            setComments(response.data.filter(c => !c.resolved));
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

    const handleResolve = async (commentId: string) => {
        try {
            await commentService.resolve(commentId);

            // Remove highlight from editor
            if (editor) {
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
            }

            loadComments();
        } catch (error) {
            console.error("Failed to resolve", error);
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

    return (
        <div className="w-80 border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full shadow-xl fixed right-0 top-0 z-40 pt-16">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Comments</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <X className="w-5 h-5" />
                </button>
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
                ) : comments.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No comments yet. Select text to add one.
                    </div>
                ) : (
                    comments.map(comment => (
                        <div
                            key={comment.id}
                            id={`comment-${comment.id}`}
                            onClick={() => scrollToComment(comment.id)}
                            className={`border rounded-lg p-3 space-y-3 cursor-pointer transition-all duration-300 ${comment.resolved ? 'bg-gray-50 opacity-60' : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-indigo-300'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500 uppercase`}>
                                        {comment.user.username[0]}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block leading-none">{comment.user.username}</span>
                                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                    </div>
                                </div>
                                {!comment.resolved && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleResolve(comment.id); }}
                                        className="text-gray-400 hover:text-green-500"
                                        title="Resolve"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>

                            {/* Replies */}
                            {comment.replies.length > 0 && (
                                <div className="space-y-2 pl-3 border-l-2 border-gray-100 dark:border-zinc-700">
                                    {comment.replies.map(reply => (
                                        <div key={reply.id} className="text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{reply.user.username}</span>
                                                <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(reply.createdAt))} ago</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Input */}
                            <div className="flex gap-2 items-center pt-2" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    placeholder="Reply..."
                                    className="flex-1 text-sm rounded-md border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={replyText[comment.id] || ""}
                                    onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleReply(comment.id);
                                    }}
                                />
                                <button
                                    onClick={() => handleReply(comment.id)}
                                    disabled={!replyText[comment.id]?.trim()}
                                    className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
