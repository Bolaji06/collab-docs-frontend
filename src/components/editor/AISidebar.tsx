import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, Sparkles, FileText, ClipboardCheck, Download } from "lucide-react";
import { aiService } from "../../services/ai-service";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { CollaborationIntelligence } from "./CollaborationIntelligence";

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AISidebarProps {
    documentId: string;
    documentContent: string;
    editor: any;
    intent: string;
    onClose: () => void;
}

export function AISidebar({ documentId, documentContent, editor, intent, onClose }: AISidebarProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your AI writing assistant. How can I help you with this document today? I can summarize it, suggest improvements, or answer questions about the content." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'synthesis'>('chat');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // We'll use the summarize endpoint as a base for custom queries for now, 
            // but in a real app, we'd have a specific chat endpoint.
            // For this implementation, we'll prefix the prompt with document context.
            const prompt = `Context from document:\n${documentContent}\n\nUser Question: ${userMessage}`;
            const response = await aiService.summarizeText(prompt); // Reusing summarize for generic chat

            setMessages(prev => [...prev, { role: 'assistant', content: response.result }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while processing your request." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed right-0 top-16 bottom-0 w-[400px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex flex-col z-40 shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl w-full mr-2">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                    >
                        <Bot className="w-3.5 h-3.5" /> Assistant
                    </button>
                    <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'insights' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                    >
                        <Sparkles className="w-3.5 h-3.5" /> Insights
                    </button>
                    <button
                        onClick={() => setActiveTab('synthesis')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'synthesis' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
                    >
                        <FileText className="w-3.5 h-3.5" /> Synthesis
                    </button>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-gray-500">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {activeTab === 'insights' ? (
                <CollaborationIntelligence
                    documentId={documentId}
                    documentContent={documentContent}
                    editor={editor}
                    intent={intent}
                />
            ) : activeTab === 'synthesis' ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Alignment Report</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                            Generate a condensed executive summary of all decisions, tasks, and alignment status in this document.
                        </p>
                        <button
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                            onClick={() => {
                                // Simple logic to generate and download a report
                                const blocks = editor.getJSON().content.filter((n: any) => n.type === 'collaborationBlock');
                                let report = `# Alignment Report: ${intent.toUpperCase()}\n\n`;
                                report += `## Executive Summary\nGenerated on ${new Date().toLocaleDateString()}\n\n`;

                                blocks.forEach((b: any) => {
                                    const { type, status, acknowledgments = [] } = b.attrs;
                                    const text = b.content?.[0]?.text || '[No content]';
                                    report += `### [${type.toUpperCase()}] ${status.toUpperCase()}\n`;
                                    report += `> ${text}\n\n`;
                                    report += `**Acknowledgments:** ${acknowledgments.length} users\n\n---\n\n`;
                                });

                                const blob = new Blob([report], { type: 'text/markdown' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Alignment-Report-${new Date().toISOString().split('T')[0]}.md`;
                                a.click();
                            }}
                        >
                            <Download className="w-4 h-4" />
                            Export report (.md)
                        </button>
                    </section>

                    <section className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-4">
                            <Bot className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">AI Synthesis</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed">
                            Need a cross-document perspective?
                        </p>
                        <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Pro Tip</h4>
                            <p className="text-[11px] text-gray-600 dark:text-zinc-400 italic">
                                "Ask me to summarize the unresolved conflicts in this document or to list all tasks assigned to you."
                            </p>
                        </div>
                    </section>
                </div>
            ) : (
                <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1 opacity-70">
                                            {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {msg.role === 'user' ? 'You' : 'Assistant'}
                                            </span>
                                        </div>
                                        <div className={`prose prose-sm dark:prose-invert max-w-none leading-relaxed ${msg.role === 'user' ? 'text-white prose-p:text-white' : ''}`}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                placeholder="Ask anything..."
                                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[45px] max-h-[150px] transition-all dark:text-white"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md group"
                            >
                                <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">
                            Gemini may provide inaccurate info. Verify important facts.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
