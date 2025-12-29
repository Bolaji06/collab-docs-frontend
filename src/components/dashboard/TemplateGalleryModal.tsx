
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Lightbulb, Zap, HelpCircle, ArrowRight } from "lucide-react";
import { templateService, type DocumentTemplate } from "../../services/template-service";
import { useEffect, useState } from "react";

interface TemplateGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template?: DocumentTemplate) => void;
}

const getIntentIcon = (intent: string) => {
    switch (intent) {
        case 'brainstorm': return <Lightbulb className="w-5 h-5 text-amber-500" />;
        case 'decision': return <Zap className="w-5 h-5 text-indigo-500" />;
        case 'execute': return <ArrowRight className="w-5 h-5 text-emerald-500" />;
        default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
};

// MOCK DATA FOR DEBUGGING
const MOCK_TEMPLATES: DocumentTemplate[] = [
    { id: 'debug-1', name: 'Debug Template', description: 'If you see this, the API failed.', intent: 'brainstorm', content: {} }
];

export function TemplateGalleryModal({ isOpen, onClose, onSelect }: TemplateGalleryModalProps) {
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    console.log("RENDER EXECUTION - isOpen:", isOpen, "isLoading:", isLoading, "templates:", templates?.length);

    useEffect(() => {
        if (isOpen) {
            console.log("DEBUG: TemplateGalleryModal calling API...");
            setIsLoading(true);
            templateService.getTemplates()
                .then(res => {
                    console.log("DEBUG: API Response:", res);
                    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                        setTemplates(res.data);
                    } else {
                        console.warn("DEBUG: Empty/Invalid API response, using fallback.");
                        setTemplates(MOCK_TEMPLATES);
                    }
                })
                .catch(err => {
                    console.error("DEBUG: Fetch error, using fallback.", err);
                    setTemplates(MOCK_TEMPLATES);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    console.log("RENDER EXECUTION - isLoading:", isLoading, "templates:", templates?.length);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Choose a Template</h3>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">Start with a pre-configured collaboration structure.</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Blank Document Option */}
                                <motion.button
                                    whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                    onClick={() => onSelect()}
                                    className="flex flex-col text-left p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-indigo-500 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                                        <FileText className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">Blank Page</h4>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Start from scratch with a clean slate.</p>
                                </motion.button>

                                {isLoading ? (
                                    <div className="col-span-1 md:col-span-2 flex items-center justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : (
                                    Array.isArray(templates) && templates.map((template) => {
                                        console.log("RENDERING TEMPLATE:", template.id);
                                        return (
                                            <motion.button
                                                key={template.id}
                                                whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                                                onClick={() => onSelect(template)}
                                                className="flex flex-col text-left p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:border-indigo-500 transition-all shadow-sm"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
                                                        {getIntentIcon(template.intent)}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-md">
                                                        {template.intent}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{template.name}</h4>
                                                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{template.description}</p>
                                            </motion.button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-indigo-600 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white">
                                <HelpCircle className="w-5 h-5 opacity-70" />
                                <span className="text-sm font-medium">Templates come with pre-configured AI collaboration triggers.</span>
                            </div>
                            <button onClick={onClose} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-bold transition-all">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
