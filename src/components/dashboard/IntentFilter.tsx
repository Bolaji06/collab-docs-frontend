
import { Brain, Scale, FileText, Rocket, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IntentFilterProps {
    activeIntent: string | null;
    onSelectIntent: (intent: string | null) => void;
}

const intents = [
    { id: 'brainstorming', label: 'Brainstorm', icon: <Brain className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
    { id: 'decision', label: 'Decide', icon: <Scale className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
    { id: 'documentation', label: 'Document', icon: <FileText className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
    { id: 'execution', label: 'Execute', icon: <Rocket className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
];

export function IntentFilter({ activeIntent, onSelectIntent }: IntentFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                {intents.map((intent) => {
                    const isActive = activeIntent === intent.id;
                    return (
                        <button
                            key={intent.id}
                            onClick={() => onSelectIntent(isActive ? null : intent.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                                    ? `${intent.bg} ${intent.color} ${intent.border} shadow-sm border`
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            {intent.icon}
                            <span className="hidden lg:inline">{intent.label}</span>
                        </button>
                    );
                })}

                <AnimatePresence>
                    {activeIntent && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => onSelectIntent(null)}
                            className="p-1 px-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
                            title="Clear intent filter"
                        >
                            <X className="w-3.5 h-3.5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
