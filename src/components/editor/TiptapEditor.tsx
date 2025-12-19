import "./style.css";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import TableHeader from "@tiptap/extension-table-header";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { EditorToolbar } from "./EditorToolbar";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { CommentMark } from "./extensions/CommentMark";
import { Editor } from "@tiptap/react";
import { useEffect, useMemo, useState, useRef } from "react";
import { MessageSquare, Bold, Italic, Strikethrough } from "lucide-react";
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from './MentionList';
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
    documentId?: string;
    user: {
        name: string;
        color: string;
        avatar?: string;
    },
    onEditorReady?: (editor: Editor) => void;
    onAddComment?: () => void;
    onCommentClick?: (commentId: string) => void;
    mentionableUsers?: { name: string; avatar?: string; email: string }[];
}

const colors = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

// Inner component that assumes provider and ydoc are present if usage is collaborative
function TiptapEditorContent({
    content,
    onChange,
    editable,
    documentId,
    user,
    onEditorReady,
    onAddComment,
    onCommentClick,
    ydoc,
    provider,
    mentionableUsers = []
}: TiptapEditorProps & { ydoc: Y.Doc | null, provider: SocketIOProvider | null }) {

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                history: documentId ? false : undefined,
            } as any),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline cursor-pointer',
                },
            }),
            TaskList.configure({
                HTMLAttributes: {
                    class: 'not-prose pl-2',
                },
            }),
            TaskItem.configure({
                nested: true,
            }),
            Highlight,
            TextStyle,
            Color,
            FontFamily,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            // Collaboration Extensions
            ...(documentId && ydoc && provider ? [
                Collaboration.configure({
                    document: ydoc,
                }),

                CollaborationCaret.configure({
                    provider: provider,
                    user: user || {
                        name: 'Anonymous',
                        color: colors[Math.floor(Math.random() * colors.length)],
                        avatar: undefined,
                    },
                }),
            ] : []),
            CommentMark,
            Mention.configure({
                HTMLAttributes: {
                    class: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 px-1 rounded decoration-clone',
                },
                suggestion: {
                    items: ({ query }) => {
                        return mentionableUsers
                            .filter(user => user.name.toLowerCase().startsWith(query.toLowerCase()))
                            .slice(0, 5)
                            .map(u => u.name); // Currently passing just name to keep it simple, ideally pass object
                    },
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) {
                                    return;
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                });
                            },
                            onUpdate(props: any) {
                                component.updateProps(props);

                                if (!props.clientRect) {
                                    return;
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }

                                return component.ref?.onKeyDown(props);
                            },
                            onExit() {
                                popup[0].destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: documentId ? undefined : content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] p-8 prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-indigo-600 dark:prose-a:text-indigo-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 text-gray-900 dark:text-gray-100 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 dark:[&_th]:border-zinc-700 dark:[&_td]:border-zinc-700",
            },
        },
    }, [ydoc, provider, user.name, user.color, mentionableUsers]);

    // // Handle comment clicks
    // useEffect(() => {
    //     if (!editor || !onCommentClick) return;

    //     // const handleTransaction = () => {
    //     //     // We can use the selection to detect if a comment is clicked/selected
    //     //     // But simpler might be to listen to clicks on the span
    //     // };

    //     // This is a bit hacky but Tiptap doesn't natively expose mark clicks easily without an extension modification
    //     // We'll trust the extension rendering standard DOM handling or `setLink` approach logic if we were using links
    //     // But for spans, we can add a global listener on the editor element?
    //     // Better: configure the extension to add an onclick attribute? NO, dangerous.
    //     // Let's rely on standard DOM event delegation on the editor content div
    // }, [editor, onCommentClick]);

    const handleEditorClick = (e: React.MouseEvent) => {
        if (!onCommentClick) return;
        const target = e.target as HTMLElement;
        const commentId = target.getAttribute('data-comment-id');
        if (commentId) {
            onCommentClick(commentId);
        }
    };

    // Custom Bubble Menu State
    const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const [selectionRect, setSelectionRect] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!editor) return;

        const updateBubbleMenu = () => {
            const { selection } = editor.state;
            if (selection.empty || editor.isActive('image')) {
                setShowBubbleMenu(false);
                return;
            }

            // Calculate position
            // We use the DOM selection to get coordinates relative to the viewport
            // Then adjust for the scrolling container if needed, but 'fixed' or absolute relative to body is easier.
            // Let's try relative to the editor container using Tiptap's view coords.

            // Actually, we can just use the editor view's coordsAtPos
            //const { from, to } = selection;
            //const start = editor.view.coordsAtPos(from);
            //const end = editor.view.coordsAtPos(to);

            // Simple center calculation
            // Note: This coordinate is viewport relative. 
            // We need to convert it to match our rendered div's context if it's absolute.
            // However, our div is inside a container that has `overflow-auto`.
            // The easiest way is to use `fixed` position or calculate offsets.
            // For now, let's try to get the container rect.

            // Simplified: Just use window.getSelection() because Tiptap syncs it.
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
                const range = domSelection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // We'll use fixed positioning for the menu to avoid container relative issues
                // But wait, the menu is inside the scrollable container in my code.
                // Let's make it fixed? Or handle offset.
                // Let's update `selectionRect` to be relative to the viewport and use `fixed` in the render style?
                // Actually my render code uses `absolute`. Let's assume the parent `relative` is the `main` or editor wrapper.
                // The editor wrapper `.w-full.max-w-6xl` has `relative` (implicitly? no).
                // Let's check line 193: `flex-1 relative` on main.
                // The editor container line 230 has `overflow-y-auto`. `absolute` inside it will scroll with content.
                // So we need coords relative to that container.

                const editorContainer = editor.view.dom.closest('.overflow-y-auto');
                if (editorContainer) {
                    const containerRect = editorContainer.getBoundingClientRect();
                    setSelectionRect({
                        top: rect.top - containerRect.top + editorContainer.scrollTop,
                        left: rect.left - containerRect.left + (rect.width / 2)
                    });
                    setShowBubbleMenu(true);
                }
            }
        };

        editor.on('selectionUpdate', updateBubbleMenu);
        editor.on('blur', () => setShowBubbleMenu(false));
        // also update on scroll?

        return () => {
            editor.off('selectionUpdate', updateBubbleMenu);
        };
    }, [editor]);


    useEffect(() => {
        if (editor && editable !== undefined) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    const isHydrated = useRef(false);

    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Hydrate from content prop if editor is empty.
            // This is crucial for imported documents where DB has content but Yjs doc is initially empty.
            if (editor.isEmpty && content !== "" && !isHydrated.current) {
                editor.commands.setContent(content);
                isHydrated.current = true;
            }
        }
    }, [content, editor]);

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {editable && (
                <EditorToolbar
                    editor={editor}
                    onAddComment={onAddComment}
                    rightContent={
                        <CollaboratorAvatars
                            provider={provider}
                            editor={editor}
                            user={user}
                        />
                    }
                />
            )}
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#121212] flex justify-center p-4 sm:p-8">
                <style>{`
                    .collaboration-cursor__caret {
                        border-left: 1px solid #0d0d0d;
                        border-right: 1px solid #0d0d0d;
                        margin-left: -1px;
                        margin-right: -1px;
                        pointer-events: none;
                        position: relative;
                        word-break: normal;
                    }
                    .collaboration-cursor__label {
                        border-radius: 3px 3px 3px 0;
                        color: #0d0d0d;
                        font-size: 12px;
                        font-style: normal;
                        font-weight: 600;
                        left: -1px;
                        line-height: normal;
                        padding: 0.1rem 0.3rem;
                        position: absolute;
                        top: -1.4em;
                        user-select: none;
                        white-space: nowrap;
                    }
                    span[data-comment-id] {
                        background-color: #fef08a; /* yellow-200 */
                        border-bottom: 2px solid #facc15; /* yellow-400 */
                        cursor: pointer;
                    }
                    .dark span[data-comment-id] {
                        background-color: #854d0e; /* yellow-800 */
                        border-bottom: 2px solid #ca8a04; /* yellow-600 */
                        color: white;
                    }
                `}</style>
                <div className="w-full max-w-6xl bg-white dark:bg-zinc-900 min-h-[calc(100vh-12rem)] shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-y-auto cursor-text relative" onClick={(e) => {
                    editor?.chain().focus().run();
                    handleEditorClick(e);
                }}>
                    {editor && (
                        <div
                            className="absolute z-50 transition-all duration-200 pointer-events-none"
                            style={{
                                top: selectionRect ? selectionRect.top - 50 : 0,
                                left: selectionRect ? selectionRect.left : 0,
                                opacity: showBubbleMenu ? 1 : 0,
                                transform: `translate(-50%, ${showBubbleMenu ? '0' : '10px'})`,
                            }}
                        >
                            <div
                                className={`bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 flex p-1 gap-1 pointer-events-auto ${showBubbleMenu ? '' : 'hidden'}`}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <div className="flex items-center gap-1 border-r border-gray-200 dark:border-zinc-700 pr-1 mr-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            editor.chain().focus().toggleBold().run();
                                        }}
                                        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                        title="Bold"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            editor.chain().focus().toggleItalic().run();
                                        }}
                                        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                        title="Italic"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            editor.chain().focus().toggleStrike().run();
                                        }}
                                        className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                                        title="Strikethrough"
                                    >
                                        <Strikethrough className="w-4 h-4" />
                                    </button>
                                </div>
                                {onAddComment && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddComment();
                                        }}
                                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors flex items-center gap-2 text-xs font-medium"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Comment
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}

// Wrapper component to handle Yjs initialization
export function TiptapEditor(props: TiptapEditorProps) {
    const { documentId } = props;

    const ydoc = useMemo(() => {
        return documentId ? new Y.Doc() : null;
    }, [documentId]);

    const [provider, setProvider] = useState<SocketIOProvider | null>(null);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!documentId || !ydoc) {
            setProvider(null);
            return;
        }

        try {
            const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const newProvider = new SocketIOProvider(
                socketUrl,
                documentId,
                ydoc,
                {
                    autoConnect: true,
                }
            );

            setProvider(newProvider);

            return () => {
                newProvider.destroy();
            };
        } catch (err: any) {
            console.error("Failed to initialize SocketIOProvider:", err);
            setError(err.message || "Failed to connect");
        }
    }, [documentId, ydoc]);

    useEffect(() => {
        return () => {
            ydoc?.destroy();
        }
    }, [ydoc]);

    if (documentId && (!ydoc || !provider)) {
        if (error) {
            return (
                <div className="flex flex-col h-full bg-white dark:bg-zinc-900 items-center justify-center">
                    <p className="text-red-500">Connection Error: {error}</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-900 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-sm text-gray-500">Connecting to document...</p>
            </div>
        );
    }

    return (
        <TiptapEditorContent
            {...props}
            // We force a remount if the provider changes to purely clean state
            key={provider?.socket.id || 'offline'}
            ydoc={ydoc}
            provider={provider}
        />
    );
}