import "./style.css";
import Placeholder from '@tiptap/extension-placeholder';

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
const lowlight = createLowlight(common);

import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import ImageResize from 'tiptap-extension-resize-image';

import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import TableHeader from "@tiptap/extension-table-header";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { IndexeddbPersistence } from 'y-indexeddb';
import { EditorToolbar } from "./EditorToolbar";
import { ImageInsertModal } from "./ImageInsertModal";
import { DragHandle } from "./DragHandle";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { VersionHistory } from "./VersionHistory";
import { Editor } from "@tiptap/react";
import { useEffect, useMemo, useState, useRef, memo } from "react";
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { MentionList } from './MentionList';
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import Commands from "./extensions/Commands";
import { CommandList } from "./CommandList";
import {
    Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
    Image as ImageIcon, CheckSquare, Table as TableIcon, Type,
    Wand2, Sparkles, CheckCircle2, ListTodo, HelpCircle, Lightbulb, AlertTriangle, Brain, Mic
} from "lucide-react";
import { aiService } from "../../services/ai-service";
import { CollaborationBlock } from "./extensions/CollaborationBlock";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { VoiceControlWidget } from "./VoiceControlWidget";
import { AIStatus } from "./extensions/AIStatus";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import { ImageMenu } from "./ImageMenu";

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
    pageSettings?: {
        width: 'standard' | 'wide' | 'full';
        background: 'white' | 'sepia' | 'zinc' | 'slate';
        fontSize: 'sm' | 'base' | 'lg' | 'xl';
    };
}

const COLORS = ['#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', '#94FADB', '#B9F18D'];

// Inner component that assumes provider and ydoc are present if usage is collaborative
const TiptapEditorContent = memo(function TiptapEditorContent({
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
    mentionableUsers = [],
    pageSettings = { width: 'standard', background: 'white', fontSize: 'base' },
    isSynced = false,
    connectionStatus = 'connected'
}: TiptapEditorProps & { ydoc: Y.Doc | null, provider: SocketIOProvider | null, isSynced?: boolean, connectionStatus?: 'connecting' | 'connected' | 'disconnected' }) {

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                history: documentId ? false : undefined,
                codeBlock: false,
            } as any),
            CodeBlockLowlight.configure({
                lowlight,
            }),
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
            Highlight.configure({ multicolor: true }),
            TextStyle,
            Color,
            FontFamily,
            ImageResize.configure({
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
                        color: COLORS[Math.floor(Math.random() * COLORS.length)],
                        avatar: undefined,
                    },
                }),
            ] : []),
            CollaborationBlock.configure({
                users: mentionableUsers
            }),
            AIStatus,
            Placeholder.configure({
                placeholder: "Type '/' for commands",
                includeChildren: true,
            }),
            BubbleMenu.configure({
                pluginKey: 'bubbleMenu',
                shouldShow: null, // Let React component decide
            }),
            Commands.configure({
                suggestion: {
                    items: ({ query }: { query: string }) => {
                        return [
                            {
                                title: 'Heading 1',
                                description: 'Big section heading',
                                icon: <Heading1 className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
                                },
                            },
                            {
                                title: 'Heading 2',
                                description: 'Medium section heading',
                                icon: <Heading2 className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
                                },
                            },
                            {
                                title: 'Heading 3',
                                description: 'Small section heading',
                                icon: <Heading3 className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
                                },
                            },
                            {
                                title: 'Text',
                                description: 'Just start writing with plain text',
                                icon: <Type className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setNode('paragraph').run()
                                },
                            },
                            {
                                title: 'Bullet List',
                                description: 'Create a simple bulleted list',
                                icon: <List className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).toggleBulletList().run()
                                },
                            },
                            {
                                title: 'Numbered List',
                                description: 'Create a list with numbering',
                                icon: <ListOrdered className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).toggleOrderedList().run()
                                },
                            },
                            {
                                title: 'Task List',
                                description: 'Track tasks with a checklist',
                                icon: <CheckSquare className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).toggleTaskList().run()
                                },
                            },
                            {
                                title: 'Quote',
                                description: 'Capture a quotation',
                                icon: <Quote className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).toggleBlockquote().run()
                                },
                            },
                            {
                                title: 'Code Block',
                                description: 'Insert a code snippet',
                                icon: <Code className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
                                },
                            },
                            {
                                title: 'Table',
                                description: 'Insert a 3x3 table',
                                icon: <TableIcon className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                                },
                            },
                            {
                                title: 'Decision',
                                description: 'Mark a formal decision',
                                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'decision' }).run()
                                },
                            },
                            {
                                title: 'Task',
                                description: 'Create an actionable task',
                                icon: <ListTodo className="w-4 h-4 text-blue-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'task' }).run()
                                },
                            },
                            {
                                title: 'Question',
                                description: 'Raise a question for the team',
                                icon: <HelpCircle className="w-4 h-4 text-amber-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'question' }).run()
                                },
                            },
                            {
                                title: 'Note',
                                description: 'Add a collaboration note',
                                icon: <Lightbulb className="w-4 h-4 text-purple-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'note' }).run()
                                },
                            },
                            {
                                title: 'Risk',
                                description: 'Identify a project risk',
                                icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'risk' }).run()
                                },
                            },
                            {
                                title: 'Assumption',
                                description: 'Document a project assumption',
                                icon: <Brain className="w-4 h-4 text-cyan-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).setCollaborationBlock({ type: 'assumption' }).run()
                                },
                            },
                            {
                                title: 'Image',
                                description: 'Upload or link an image',
                                icon: <ImageIcon className="w-4 h-4" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).run()
                                    setIsImageModalOpen(true);
                                },
                            },
                            {
                                title: 'AI: Summarize',
                                description: 'Summarize the current document',
                                icon: <Wand2 className="w-4 h-4 text-purple-500" />,
                                command: async ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).insertContent('AI is summarizing...').run();
                                    try {
                                        const response = await aiService.summarizeText(editor.getText());
                                        editor.chain().focus().extendMarkRange('paragraph').insertContent(response.result).run();
                                    } catch (error) {
                                        console.error(error);
                                    }
                                },
                            },
                            {
                                title: 'AI: Improve Writing',
                                description: 'Refine and polish your text',
                                icon: <Sparkles className="w-4 h-4 text-blue-500" />,
                                command: async ({ editor, range }: any) => {
                                    const { from, to } = editor.state.selection;
                                    const selectedText = editor.state.doc.textBetween(from, to, ' ');
                                    const textToImprove = selectedText || editor.getText();

                                    editor.chain().focus().deleteRange(range).insertContent('AI is refining your writing...').run();
                                    try {
                                        const response = await aiService.improveWriting(textToImprove);
                                        editor.chain().focus().extendMarkRange('paragraph').insertContent(response.result).run();
                                    } catch (error) {
                                        console.error(error);
                                    }
                                },
                            },
                            {
                                title: 'Meeting',
                                description: 'Start voice recording',
                                icon: <Mic className="w-4 h-4 text-red-500" />,
                                command: ({ editor, range }: any) => {
                                    editor.chain().focus().deleteRange(range).run()
                                    window.dispatchEvent(new CustomEvent('start-voice-recording'));
                                },
                            },
                            {
                                title: 'AI: Continue Writing',
                                description: 'Generate text based on context',
                                icon: <Wand2 className="w-4 h-4 text-purple-500" />,
                                command: async ({ editor, range }: any) => {
                                   // const { from, to } = editor.state.selection;
                                    const context = editor.getText();

                                    // Insert the atom node
                                    editor.chain().focus().deleteRange(range).insertContent({ type: 'aiStatus' }).run();

                                    try {
                                        const response = await aiService.generateText(context);

                                        // Replace the atom node with result.
                                        // Since it's an atom, we can find it by type or assume it is at the cursor position (inserted).
                                        // However, insertContent might leave cursor after it.

                                        // Robust way: Find the node in the doc.
                                        let pos = -1;
                                        editor.state.doc.descendants((node: any, position: number) => {
                                            if (node.type.name === 'aiStatus') {
                                                pos = position;
                                                return false; // stop iteration
                                            }
                                        });

                                        if (pos > -1) {
                                            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).insertContent(response.result).run();
                                        } else {
                                            // Fallback
                                            editor.chain().focus().insertContent(response.result).run();
                                        }

                                    } catch (error) {
                                        console.error(error);
                                        // Remove indicator on error
                                        let pos = -1;
                                        editor.state.doc.descendants((node: any, position: number) => {
                                            if (node.type.name === 'aiStatus') {
                                                pos = position;
                                                return false;
                                            }
                                        });
                                        if (pos > -1) {
                                            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
                                        }
                                    }
                                },
                            },
                        ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
                    },
                    render: () => {
                        let component: any
                        let popup: any

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(CommandList, {
                                    props,
                                    editor: props.editor,
                                })

                                if (!props.clientRect) {
                                    return
                                }

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                })
                            },

                            onUpdate(props: any) {
                                component.updateProps(props)

                                if (!props.clientRect) {
                                    return
                                }

                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                })
                            },

                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide()

                                    return true
                                }

                                return component.ref?.onKeyDown(props)
                            },

                            onExit() {
                                popup[0].destroy()
                                component.destroy()
                            },
                        }
                    },
                },
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 px-1 rounded decoration-clone',
                },
                suggestion: {
                    items: ({ query }) => {
                        return mentionableUsers
                            .filter(user => user.name.toLowerCase().startsWith(query.toLowerCase()))
                            .slice(0, 5);
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

   // const [showBubbleMenu, setShowBubbleMenu] = useState(false);
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
    const [isPaged, setIsPaged] = useState(true); // Default to paged view
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [imageMenuPos, setImageMenuPos] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (!editor) return;

        const updateMenus = () => {
            // Check for Image Selection
            if (editor.isActive('image')) {
                const domSelection = window.getSelection();
                if (domSelection && domSelection.rangeCount > 0) {
                    // When an image is selected in Tiptap, the selection is a NodeSelection.
                    // The DOM selection might wrap the image or wrapper.
                    // Let's rely on the editor view to match the node view element.
                    // Actually, getting the node pos is better.
                    const { from } = editor.state.selection;
                    const node = editor.view.nodeDOM(from) as HTMLElement;

                    if (node) {
                        const rect = node.getBoundingClientRect();
                        const editorContainer = editor.view.dom.closest('.overflow-y-auto');

                        if (editorContainer) {
                            const containerRect = editorContainer.getBoundingClientRect();
                            // Position centered above the image
                            setImageMenuPos({
                                top: rect.top - containerRect.top + editorContainer.scrollTop - 50, // 50px above
                                left: rect.left - containerRect.left + (rect.width / 2) - 80 // Centered (approx width 160)
                            });
                        }
                    } else {
                        // Fallback to DOM range if nodeDOM fails (sometimes handles text selection)
                        const range = domSelection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        const editorContainer = editor.view.dom.closest('.overflow-y-auto');
                        if (editorContainer) {
                            const containerRect = editorContainer.getBoundingClientRect();
                            setImageMenuPos({
                                top: rect.top - containerRect.top + editorContainer.scrollTop - 40,
                                left: rect.left - containerRect.left + (rect.width / 2) - 80
                            });
                        }
                    }
                }
                return;
            }

            // Hide if not image
            setImageMenuPos(null);
        };

        editor.on('selectionUpdate', updateMenus);
        editor.on('blur', () => setImageMenuPos(null));

        return () => {
            editor.off('selectionUpdate', updateMenus);
        };
    }, [editor]);


    useEffect(() => {
        if (editor && editable !== undefined) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    const isHydrated = useRef(false);

    useEffect(() => {
        // Only hydrate when provider is synced (or if we are not using a provider, but here we enforce one for docs)
        // If !isSynced, we don't know if ydoc is truly empty or just waiting for data.
        // EXCEPTION: If we are offline (disconnected), we should trust our local data/props and hydrate.
        const isOffline = connectionStatus === 'disconnected';
        if (!editor || !content || isHydrated.current || (documentId && !isSynced && !isOffline)) return;

        // Hydrate from content prop if editor is empty AND ydoc is effectively empty.
        // This is crucial for imported documents where DB has content but Yjs doc is initially fresh.
        const isYdocEmpty = ydoc ? ydoc.getXmlFragment('default').length === 0 : true;

        if (editor.isEmpty && isYdocEmpty && content !== "") {
            editor.commands.setContent(content);
            isHydrated.current = true;
        } else if (!editor.isEmpty || !isYdocEmpty) {
            // Document already has content, mark as hydrated to stay out of the way
            isHydrated.current = true;
        }
    }, [content, editor, ydoc, isSynced, documentId, connectionStatus]);

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor]);

    // Handle awareness status (typing, profile)
    useEffect(() => {
        if (provider && user) {
            provider.awareness.setLocalStateField('user', {
                name: user.name,
                color: user.color,
                avatar: user.avatar,
            });

            let typingTimeout: any;
            const handleUpdate = () => {
                provider.awareness.setLocalStateField('isTyping', true);
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    provider.awareness.setLocalStateField('isTyping', false);
                }, 2000);
            };

            editor?.on('update', handleUpdate);

            return () => {
                editor?.off('update', handleUpdate);
                clearTimeout(typingTimeout);
            };
        }
    }, [provider, user, editor]);

    if (!editor) {
        return null;
    }

    const { isListening, isPaused, transcript, startListening, stopListening, pauseListening, resetTranscript, hasRecognitionSupport } = useSpeechRecognition();

    useEffect(() => {
        if (!editor || !transcript) return;

        // Insert the transcript at current selection (with a space if needed)
        // We only append processed chunks.
        editor.chain().focus().insertContent(transcript + ' ').run();

        // Consumed the transcript buffer
        resetTranscript();
    }, [editor, transcript, resetTranscript]);

    // Command Event Listeners
    useEffect(() => {
        const handleStartVoice = () => startListening();
        window.addEventListener('start-voice-recording', handleStartVoice);
        return () => window.removeEventListener('start-voice-recording', handleStartVoice);
    }, [startListening]);

    return (
        <div className={`flex flex-col h-full transition-colors duration-500 rounded-xl overflow-hidden ${pageSettings.background === 'sepia' ? 'bg-[#f4ecd8]' :
            pageSettings.background === 'zinc' ? 'bg-zinc-100' :
                pageSettings.background === 'slate' ? 'bg-slate-100' :
                    'bg-white dark:bg-zinc-900'
            }`}>
            {editable && (
                <EditorToolbar
                    editor={editor}
                    onAddComment={onAddComment}
                    onShowHistory={() => setIsVersionHistoryOpen(true)}
                    isPaged={isPaged}
                    onTogglePaged={() => setIsPaged(!isPaged)}
                    onImageClick={() => setIsImageModalOpen(true)}

                    hasSpeechSupport={hasRecognitionSupport}
                    isListening={isListening}
                    onVoiceStart={startListening}
                    onVoiceStop={stopListening}

                    rightContent={
                        <CollaboratorAvatars
                            provider={provider}
                            editor={editor}
                            user={user}
                        />
                    }
                />
            )}
            {imageMenuPos && (
                <ImageMenu
                    editor={editor}
                    style={{
                        top: imageMenuPos.top,
                        left: imageMenuPos.left
                    }}
                />
            )}
            <VoiceControlWidget
                isListening={isListening}
                isPaused={isPaused}
                onPause={pauseListening}
                onResume={startListening} // Re-using start for resume if it handles logic, checking hook
                onStop={stopListening}
            />
            <ImageInsertModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onInsert={(url) => editor?.chain().focus().setImage({ src: url }).run()}
            />

            {editable && <DragHandle editor={editor} />}

            {/* Offline/Status Indicator */}
            <div className="absolute top-2 right-2 z-50 pointer-events-none flex flex-col items-end gap-1">
                {connectionStatus === 'disconnected' && (
                    <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium border border-yellow-200 dark:border-yellow-800/50 shadow-sm">
                        Offline • Changes saved locally
                    </div>
                )}
                {connectionStatus === 'connecting' && (
                    <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800/50 shadow-sm animate-pulse">
                        Syncing...
                    </div>
                )}
            </div>
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

                    /* Paged View Styles */
                    .editor-paged .ProseMirror {
                        min-height: 1123px;
                        padding: 4rem 3rem !important;
                        background-image: repeating-linear-gradient(
                            to bottom,
                            var(--page-bg) 0px,
                            var(--page-bg) 1080px,
                            var(--gap-bg) 1080px,
                            var(--gap-bg) 1120px
                        );
                        background-attachment: local; /* Scrolls with content */
                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    }
                    
                    .editor-paged {
                        --page-bg: #ffffff;
                        --gap-bg: #f3f4f6;
                    }
                    .dark .editor-paged {
                        --page-bg: #18181b; /* zinc-900 */
                        --gap-bg: #09090b; /* zinc-950 or darker */
                    }
                    .bg-\[\#fefaf0\]\! .editor-paged {
                        --page-bg: #fefaf0;
                        --gap-bg: #eaddcf;
                    }
                    
                    /* AI Generation Indicator */
                    .ai-generating {
                        color: #8b5cf6; /* violet-500 */
                        font-style: italic;
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    .dark .ai-generating {
                        color: #a78bfa; /* violet-400 */
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: .5; }
                    }
                `}</style>
                <div className={`w-full mx-auto bg-white dark:bg-zinc-900 min-h-[calc(100vh-12rem)] shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-y-auto cursor-text relative transition-all duration-300 ${pageSettings.width === 'standard' ? 'max-w-4xl' :
                    pageSettings.width === 'wide' ? 'max-w-6xl' :
                        'max-w-none px-4'
                    } ${pageSettings.fontSize === 'sm' ? 'text-sm' :
                        pageSettings.fontSize === 'lg' ? 'text-lg' :
                            pageSettings.fontSize === 'xl' ? 'text-xl' :
                                'text-base'
                    } ${pageSettings.background === 'sepia' ? 'bg-[#fefaf0]! text-[#433422]!' :
                        pageSettings.background === 'zinc' ? 'dark:bg-zinc-800!' :
                            pageSettings.background === 'slate' ? 'dark:bg-slate-800!' :
                                ''
                    } ${isPaged ? 'editor-paged shadow-none border-none bg-transparent! dark:bg-transparent!' : ''}`} onClick={(e) => {
                        editor?.chain().focus().run();
                        handleEditorClick(e);
                    }}>
                    {editor && isPaged ? (
                        <EditorContent editor={editor} className="h-full" />
                    ) : (
                        <EditorContent editor={editor} className="h-full min-h-[500px]" />
                    )}
                </div>
            </div>

            {documentId && (
                <VersionHistory
                    isOpen={isVersionHistoryOpen}
                    onClose={() => setIsVersionHistoryOpen(false)}
                    documentId={documentId}
                    onRestore={(content) => {
                        editor.commands.setContent(content);
                    }}
                />
            )}
        </div>
    );
});

// Wrapper component to handle Yjs initialization
export function TiptapEditor(props: TiptapEditorProps) {
    const { documentId } = props;

    const ydoc = useMemo(() => {
        return documentId ? new Y.Doc() : null;
    }, [documentId]);

    const [provider, setProvider] = useState<SocketIOProvider | null>(null);

    const [error, setError] = useState<string | null>(null);

    const [isSynced, setIsSynced] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    useEffect(() => {
        if (provider) {
            setIsSynced(false);

            const handleSynced = (state: boolean) => {
                setIsSynced(state);
            };

            const handleStatus = ({ status }: { status: 'connecting' | 'connected' | 'disconnected' }) => {
                setConnectionStatus(status);
                if (status === 'connected') {
                    setError(null);
                }
            };

            // y-socket.io might expose 'synced' event with boolean or just trigger
            provider.on('synced', handleSynced);
            provider.on('status', handleStatus);

            // Access underlying socket to handle connection events robustly
            // This ensures we catch 'disconnected' state even if provider.on('status') lags or behaves differently
            const socket = provider.socket;
            if (socket) {
                socket.on('connect', () => {
                    setConnectionStatus('connected');
                    setError(null);
                });
                socket.on('disconnect', () => {
                    setConnectionStatus('disconnected');
                });
                socket.on('connect_error', (err: any) => {
                    console.warn("Socket connection error:", err);
                    setConnectionStatus('disconnected');
                    // We don't set 'error' state here to avoid showing the fatal error screen
                    // relying on offline mode instead.
                });
            }

            return () => {
                provider.off('synced', handleSynced);
                provider.off('status', handleStatus);
                if (socket) {
                    socket.off('connect');
                    socket.off('disconnect');
                    socket.off('connect_error');
                }
            };
        }
    }, [provider]);

    useEffect(() => {
        if (!documentId || !ydoc) {
            setProvider(null);
            return;
        }

        // Initialize offline persistence
        const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc);

        indexeddbProvider.on('synced', () => {
            console.log('IndexedDB synced');
        });

        try {
            const BASE_URL = import.meta.env.DEV ? import.meta.env.VITE_DEV_API_URL : import.meta.env.VITE_API_URL;
            const socketUrl = BASE_URL?.replace(/\/api$/, '');
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
                indexeddbProvider.destroy();
            };
        } catch (err: any) {
            console.error("Failed to initialize SocketIOProvider:", err);
            setError(err.message || "Failed to connect");
            setConnectionStatus('disconnected');
        }
    }, [documentId, ydoc]);

    useEffect(() => {
        return () => {
            ydoc?.destroy();
        }
    }, [ydoc]);

    if (documentId && (!ydoc)) {
        // If NO ydoc and NO provider, we can't do anything.
        // But ydoc is created in useMemo, so it's only null if documentId is null (which is handled by outer check)
        // or if we decide ydoc is null.
        if (error) {
            return (
                <div className="flex flex-col h-full bg-white dark:bg-zinc-900 items-center justify-center">
                    <p className="text-red-500 mb-2">Connection Error: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                    >
                        Reload to retry
                    </button>
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

    // If we have documentId and ydoc, but provider is null (e.g. error/init failed),
    // we renders TiptapEditorContent. It handles nullable provider.
    // connectionStatus should be 'disconnected' (set in catch block).


    return (
        <TiptapEditorContent
            {...props}
            // Use a stable key to prevent re-mounting and losing ref state (like isHydrated)
            key={documentId || 'static'}
            ydoc={ydoc}
            provider={provider}
            isSynced={isSynced}
            connectionStatus={connectionStatus}
        />
    );
}