import { Editor } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { ToolbarButton } from "./EditorToolbar"; // Re-using ToolbarButton style

interface ImageMenuProps {
    editor: Editor;
    style?: React.CSSProperties;
}

export function ImageMenu({ editor, style }: ImageMenuProps) {
    // Menu content
    if (!editor) return null;

    return (
        <div
            style={style}
            className="absolute z-50 flex items-center gap-1 p-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg rounded-lg animate-in fade-in zoom-in-95 duration-200"
        >
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
            >
                <AlignLeft className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
            >
                <AlignCenter className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
            >
                <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1" />

            <ToolbarButton
                onClick={() => editor.chain().focus().deleteSelection().run()}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Delete Image"
            >
                <Trash2 className="w-4 h-4" />
            </ToolbarButton>
        </div>
    );
}
