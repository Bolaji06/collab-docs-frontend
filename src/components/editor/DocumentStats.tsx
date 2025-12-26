import { useMemo } from 'react';
import { BarChart3, Clock, Type, FileText } from 'lucide-react';

interface DocumentStatsProps {
    content: string;
}

export function DocumentStats({ content }: DocumentStatsProps) {
    const stats = useMemo(() => {
        // Basic text extraction from HTML
        const text = content.replace(/<[^>]*>/g, ' ').trim();
        const words = text ? text.split(/\s+/).length : 0;
        const characters = text.length;
        const readingTime = Math.ceil(words / 200); // Average reading speed 200 wpm

        // Estimate sentences (naively)
        const sentences = text ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;

        return { words, characters, readingTime, sentences };
    }, [content]);

    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Document Insights
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                        <Type className="w-3 h-3" />
                        Words
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.words}</div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                        <FileText className="w-3 h-3" />
                        Sentences
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.sentences}</div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                        <Clock className="w-3 h-3" />
                        Reading Time
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">~{stats.readingTime} min</div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                        <BarChart3 className="w-3 h-3" />
                        Characters
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{stats.characters}</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                    Readability Tip
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                    {stats.words > 0 && stats.words / stats.sentences > 20
                        ? "Your sentences are quite long. Consider breaking them up for better readability."
                        : "Sentence length looks good for general accessibility."}
                </p>
            </div>
        </div>
    );
}
