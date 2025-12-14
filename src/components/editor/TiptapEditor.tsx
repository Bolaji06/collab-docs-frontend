import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { EditorToolbar } from "./EditorToolbar";
import { useEffect } from "react";

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
    editable?: boolean;
}

export function TiptapEditor({ content, onChange, editable = true }: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Placeholder.configure({
                placeholder: "Start typing...",
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
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] p-8 prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-indigo-600 dark:prose-a:text-indigo-400 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 text-gray-900 dark:text-gray-100 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 dark:[&_th]:border-zinc-700 dark:[&_td]:border-zinc-700",
            },
        },
    });

    // Update content if it changes externally (e.g. loaded from API)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Check if content is actually different to avoid cursor jumping
            // A simple check often isn't enough for rich text, so we rely on initial load usually
            // For this implementation, we assume content prop is primarily for initial load
            if (editor.getText() === "" && content !== "") {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#121212] flex justify-center p-4 sm:p-8">
                <div className="w-full max-w-6xl bg-white dark:bg-zinc-900 min-h-[calc(100vh-12rem)] shadow-sm border border-gray-200 dark:border-zinc-800 rounded-xl overflow-y-auto cursor-text" onClick={() => editor?.chain().focus().run()}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
