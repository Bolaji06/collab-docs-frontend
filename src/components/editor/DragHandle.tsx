import { Editor } from '@tiptap/react';
import {
    GripVertical, Trash2, Copy, Palette, ChevronRight,
    Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, ArrowRightLeft, Bold, Sparkles
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AIPromptModal } from './AIPromptModal';
import { aiService } from '../../services/ai-service';

interface DragHandleProps {
    editor: Editor;
}

const COLORS = [
    { name: 'Default', color: 'inherit', bg: 'transparent' },
    { name: 'Gray', color: '#9B9A97', bg: '#EBECED' },
    { name: 'Brown', color: '#64473A', bg: '#E9E5E3' },
    { name: 'Orange', color: '#D9730D', bg: '#FAEBDD' },
    { name: 'Yellow', color: '#DFAB01', bg: '#FBF3DB' },
    { name: 'Green', color: '#0F7B6C', bg: '#DDEDEA' },
    { name: 'Blue', color: '#0B6E99', bg: '#DDEBF1' },
    { name: 'Purple', color: '#6940A5', bg: '#EAE4F2' },
    { name: 'Pink', color: '#AD1A72', bg: '#F4DFEB' },
    { name: 'Red', color: '#E03E3E', bg: '#FBE4E4' },
];

export function DragHandle({ editor }: DragHandleProps) {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState<'color' | 'turnInto' | null>(null);
    const [currentBlockNode, setCurrentBlockNode] = useState<HTMLElement | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!editor || !editor.view) return;

        const handleMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (menuOpen) return;

            if (menuRef.current && (menuRef.current === target || menuRef.current.contains(target))) {
                return;
            }

            const editorDom = editor.view.dom;
            if (!editorDom.contains(target)) {
                if (!menuOpen) {
                    setPosition(null);
                }
                return;
            }

            const block = target.closest('.ProseMirror > *') as HTMLElement;

            if (block && !block.classList.contains('ProseMirror')) {
                const rect = block.getBoundingClientRect();
                setPosition({
                    top: rect.top,
                    left: rect.left - 32
                });
                setCurrentBlockNode(block);
            } else {
                if (!menuOpen) setPosition(null);
            }
        };

        const debouncedHandler = (e: MouseEvent) => handleMouseMove(e);
        document.addEventListener('mousemove', debouncedHandler);

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setSubmenuOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousemove', debouncedHandler);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editor, menuOpen]);

    const executeCommand = (command: () => void) => {
        if (!currentBlockNode) return;
        const pos = editor.view.posAtDOM(currentBlockNode, 0);
        if (pos === null || pos === undefined) return;

        const resolved = editor.state.doc.resolve(pos);
        const blockPos = resolved.before(1);

        // Select the block to ensure command applies to it
        editor.chain().focus().setNodeSelection(blockPos).run();

        command();

        setMenuOpen(false);
        setSubmenuOpen(null);
        setPosition(null);
    };

    const duplicateBlock = () => executeCommand(() => {
        const pos = editor.view.posAtDOM(currentBlockNode!, 0);
        const resolved = editor.state.doc.resolve(pos);
        const blockPos = resolved.before(1);
        const node = editor.state.doc.nodeAt(blockPos);
        if (node) {
            // We need to use insertContentAt, setNodeSelection is already handled by executeCommand but strictly we just need the node
            editor.chain().insertContentAt(blockPos + node.nodeSize, node.toJSON()).run();
        }
    });

    const deleteBlock = () => executeCommand(() => {
        editor.chain().deleteSelection().run();
    });

    const setTextColor = (color: string) => executeCommand(() => {
        editor.chain().setColor(color).run();
    });

    const setBgColor = (color: string) => executeCommand(() => {
        if (color === 'transparent') {
            editor.chain().unsetHighlight().run();
        } else {
            editor.chain().toggleHighlight({ color }).run();
        }
    });

    const turnInto = (type: string, level?: number) => executeCommand(() => {
        switch (type) {
            case 'paragraph': editor.chain().setParagraph().run(); break;
            case 'heading': if (level) editor.chain().toggleHeading({ level: level as 1 | 2 | 3 }).run(); break;
            case 'bulletList': editor.chain().toggleBulletList().run(); break;
            case 'orderedList': editor.chain().toggleOrderedList().run(); break;
            case 'taskList': editor.chain().toggleTaskList().run(); break;
            case 'blockquote': editor.chain().toggleBlockquote().run(); break;
            case 'codeBlock': editor.chain().toggleCodeBlock().run(); break;
            case 'bold': editor.chain().toggleBold().run(); break;
        }
    });

    const handleAskAI = (instruction: string) => {
        setAiLoading(true);
        executeCommand(async () => {
            try {
                // Get content of the block
                const { from, to } = editor.state.selection;
                const text = editor.state.doc.textBetween(from, to, ' ');

                const response = await aiService.editContent(text || editor.getText(), instruction);

                if (response.result) {
                    editor.chain().focus().insertContent(response.result).run();
                }
            } catch (error) {
                console.error("AI Edit failed", error);
            } finally {
                setAiLoading(false);
                setAiModalOpen(false);
            }
        });
    };

    const openAskAI = () => {
        setMenuOpen(false);
        setAiModalOpen(true);
    };

    if (!position && !aiModalOpen) return null;

    return (
        <>
            {position && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-50 transition-opacity duration-200"
                    style={{
                        top: position.top,
                        left: position.left,
                        opacity: 1,
                    }}
                >
                    {/* ... Grip Handle ... */}
                    <div
                        className="flex items-center justify-center w-8 h-8 text-gray-400 rounded hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                        draggable="true"
                        onDragStart={(e) => { e.preventDefault(); }}
                        onClick={() => {
                            setMenuOpen(!menuOpen);
                            setSubmenuOpen(null);
                        }}
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>

                    {menuOpen && (
                        <div className="absolute top-8 left-0 mt-1 w-56 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-visible flex flex-col z-10000 py-1">

                            <button onClick={openAskAI} className="px-3 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2 font-medium">
                                <Sparkles className="w-4 h-4" /> <span>Ask AI...</span>
                            </button>

                            <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>

                            {/* Actions */}
                            <button onClick={duplicateBlock} className="px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> <span>Duplicate</span>
                            </button>
                            {/* ... remaining menu items ... */}

                            {/* Turn Into Submenu Trigger */}
                            <div className="relative group">
                                <button
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                                    onMouseEnter={() => setSubmenuOpen('turnInto')}
                                    onClick={() => setSubmenuOpen(submenuOpen === 'turnInto' ? null : 'turnInto')}
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4" /> <span>Turn into</span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>

                                {submenuOpen === 'turnInto' && (
                                    <div
                                        className="absolute top-0 left-full ml-1 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1"
                                        onMouseEnter={() => setSubmenuOpen('turnInto')}
                                        onMouseLeave={() => setSubmenuOpen(null)}
                                    >
                                        <button onClick={() => turnInto('paragraph')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Type className="w-4 h-4" /> <span>Text</span>
                                        </button>
                                        <button onClick={() => turnInto('bold')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Bold className="w-4 h-4" /> <span>Bold</span>
                                        </button>
                                        <button onClick={() => turnInto('heading', 1)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Heading1 className="w-4 h-4" /> <span>Heading 1</span>
                                        </button>
                                        <button onClick={() => turnInto('heading', 2)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Heading2 className="w-4 h-4" /> <span>Heading 2</span>
                                        </button>
                                        <button onClick={() => turnInto('heading', 3)} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Heading3 className="w-4 h-4" /> <span>Heading 3</span>
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>
                                        <button onClick={() => turnInto('bulletList')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <List className="w-4 h-4" /> <span>Bullet List</span>
                                        </button>
                                        <button onClick={() => turnInto('orderedList')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <ListOrdered className="w-4 h-4" /> <span>Numbered List</span>
                                        </button>
                                        <button onClick={() => turnInto('taskList')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4" /> <span>Todo List</span>
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-zinc-800 my-1"></div>
                                        <button onClick={() => turnInto('blockquote')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Quote className="w-4 h-4" /> <span>Quote</span>
                                        </button>
                                        <button onClick={() => turnInto('codeBlock')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2">
                                            <Code className="w-4 h-4" /> <span>Code</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Color Submenu Trigger */}
                            <div className="relative group">
                                <button
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                                    onMouseEnter={() => setSubmenuOpen('color')}
                                    onClick={() => setSubmenuOpen(submenuOpen === 'color' ? null : 'color')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Palette className="w-4 h-4" />
                                        <span>Color</span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-gray-400" />
                                </button>

                                {submenuOpen === 'color' && (
                                    <div
                                        className="absolute top-0 left-full ml-1 w-64 h-80 overflow-y-auto bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1 no-scrollbar"
                                        onMouseEnter={() => setSubmenuOpen('color')}
                                        onMouseLeave={() => setSubmenuOpen(null)}
                                    >
                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">Text Color</div>
                                        {COLORS.map((c) => (
                                            <button
                                                key={`text-${c.name}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTextColor(c.color);
                                                }}
                                                className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-xs font-medium" style={{ color: c.color }}>A</div>
                                                <span style={{ color: c.name === 'Default' ? undefined : c.color }}>{c.name}</span>
                                            </button>
                                        ))}

                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase mt-2">Background</div>
                                        {COLORS.map((c) => (
                                            <button
                                                key={`bg-${c.name}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBgColor(c.bg);
                                                }}
                                                className="w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium" style={{ backgroundColor: c.bg }}>A</div>
                                                <span>{c.name} background</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 dark:border-zinc-700 my-1"></div>

                            <button onClick={deleteBlock} className="px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> <span>Delete</span>
                            </button>

                        </div>
                    )}
                </div>,
                document.body
            )}

            <AIPromptModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                onSubmit={handleAskAI}
                isLoading={aiLoading}
                position={position || { top: 0, left: 0 }}
            />
        </>
    );
}
