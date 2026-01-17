import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface AIPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (instruction: string) => void;
    isLoading: boolean;
    position: { top: number; left: number };
}

export function AIPromptModal({ isOpen, onClose, onSubmit, isLoading, position }: AIPromptModalProps) {
    const [instruction, setInstruction] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setInstruction('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (instruction.trim()) {
            onSubmit(instruction);
        }
    };

    return createPortal(
        <div
            className="fixed z-50 flex flex-col w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-3"
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ask AI</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="E.g., Make this more professional..."
                    className="w-full text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    disabled={isLoading}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!instruction.trim() || isLoading}
                        className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        Generate
                    </button>
                </div>
            </form>
        </div>,
        document.body
    );
}
