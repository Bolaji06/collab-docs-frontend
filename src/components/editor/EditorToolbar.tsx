import { type Editor } from "@tiptap/react";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    CheckSquare,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Highlighter,
    Undo,
    Redo,
    Image as ImageIcon,
    Table as TableIcon,
    MessageSquare
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface EditorToolbarProps {
    editor: Editor | null;
    onAddComment?: () => void;
    rightContent?: React.ReactNode;
}

export function EditorToolbar({ editor, onAddComment, rightContent }: EditorToolbarProps) {
    if (!editor) return null;

    const ToolbarButton = ({
        onClick,
        isActive = false,
        disabled = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title?: string;
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center min-w-[32px] h-8",
                isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-200",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
            )}
        >
            {children}
        </button>
    );

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)
        if (url === null) return
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const addImage = () => {
        const url = window.prompt('Image URL')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    return (
        <div className="border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-10 px-4 py-2 flex flex-wrap items-center gap-1">
            {/* History */}
            <div className="flex items-center gap-1 mr-2">
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Typography */}
            <div className="flex items-center gap-1">
                <select
                    className="h-8 text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 rounded px-2 w-28"
                    onChange={(e) => {
                        const font = e.target.value;
                        if (font === 'Inter') editor.chain().focus().unsetFontFamily().run();
                        else editor.chain().focus().setFontFamily(font).run();
                    }}
                    value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
                >
                    <option value="Inter" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200">Inter</option>
                    <option value="Comic Sans MS, Comic Sans" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200">Comic Sans</option>
                    <option value="serif" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200">Serif</option>
                    <option value="monospace" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200">Monospace</option>
                    <option value="cursive" className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200">Cursive</option>
                </select>

                <div className="relative flex items-center">
                    <input
                        type="color"
                        className="w-6 h-6 p-0 border-0 overflow-hidden rounded cursor-pointer opacity-0 absolute inset-0"
                        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        title="Text Color"
                    />
                    <ToolbarButton onClick={() => { }} title="Text Color">
                        <div
                            className="w-4 h-4 rounded-sm border border-gray-200 dark:border-zinc-700"
                            style={{ backgroundColor: editor.getAttributes('textStyle').color || 'currentColor' }}
                        />
                    </ToolbarButton>
                </div>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Basic Formatting */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
                <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
                <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
                <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
                <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive("highlight")} title="Highlight">
                <Highlighter className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Alignment */}
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
                <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
                <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
                <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Structure */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="H1">
                <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="H2">
                <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="H3">
                <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List">
                <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Ordered List">
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive("taskList")} title="Task List">
                <CheckSquare className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2" />

            {/* Insert */}
            <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} title="Link">
                <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={addImage} title="Image">
                <ImageIcon className="w-4 h-4" />
            </ToolbarButton>
            {onAddComment && (
                <ToolbarButton onClick={onAddComment} title="Add Comment" disabled={editor.state.selection.empty}>
                    <MessageSquare className="w-4 h-4" />
                </ToolbarButton>
            )}
            <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
                <TableIcon className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote">
                <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} title="Code">
                <Code className="w-4 h-4" />
            </ToolbarButton>

            {rightContent && (
                <div className="ml-auto pl-4 border-l border-gray-200 dark:border-zinc-800 flex items-center">
                    {rightContent}
                </div>
            )}
        </div>
    );
}
