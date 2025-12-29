import React, { useMemo } from 'react';
import {
    X, CheckCircle2, ListTodo, HelpCircle, Lightbulb,
    AlertTriangle, Brain, Target, Clock,
    Search, Filter, ChevronRight, Sparkles
} from 'lucide-react';

interface DocumentDashboardProps {
    editor: any;
    onClose: () => void;
    onJumpTo: (pos: number) => void;
    onSendNudge: (users: any[]) => void;
    mentionableUsers: any[];
}

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({ editor, onClose, onJumpTo, onSendNudge, mentionableUsers }) => {
    const blocks = useMemo(() => {
        if (!editor) return [];
        const found: any[] = [];
        editor.state.doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'collaborationBlock') {
                found.push({
                    ...node.attrs,
                    pos,
                    text: node.textContent.substring(0, 100) + (node.textContent.length > 100 ? '...' : '')
                });
            }
        });
        return found;
    }, [editor]);

    const stats = useMemo(() => {
        const waitingSet = new Set();
        blocks.forEach(b => {
            if (b.type === 'decision' || b.type === 'task') {
                mentionableUsers.forEach(u => {
                    if (!b.acknowledgments?.some((ack: any) => ack.userId === u.id)) {
                        waitingSet.add(u);
                    }
                });
            }
        });

        return {
            total: blocks.length,
            decisions: blocks.filter(b => b.type === 'decision').length,
            tasks: blocks.filter(b => b.type === 'task').length,
            risks: blocks.filter(b => b.type === 'risk').length,
            pendingAcks: waitingSet.size,
            waitingUsers: Array.from(waitingSet)
        };
    }, [blocks, mentionableUsers]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'decision': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'task': return <ListTodo className="w-4 h-4 text-blue-500" />;
            case 'question': return <HelpCircle className="w-4 h-4 text-amber-500" />;
            case 'note': return <Lightbulb className="w-4 h-4 text-purple-500" />;
            case 'risk': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case 'assumption': return <Brain className="w-4 h-4 text-cyan-500" />;
            default: return <Target className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
                <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-indigo-600" />
                        Priority Board
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 font-medium italic">Command center for shared understanding</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-400"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 p-6 bg-gray-50/50 dark:bg-zinc-900/20">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.total}</div>
                    <div className="text-[10px] uppercase font-black text-gray-400">Total Items</div>
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Target className="w-12 h-12" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                    <div className="text-2xl font-black text-amber-500">{stats.pendingAcks}</div>
                    <div className="text-[10px] uppercase font-black text-gray-400">Unseen by Team</div>
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Clock className="w-12 h-12" />
                    </div>
                </div>
            </div>

            {/* Blocks List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Collaboration Index</h3>
                    <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <Filter className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                </div>

                {blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-gray-100 dark:bg-zinc-900 rounded-full">
                            <Target className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400 italic">No collaboration blocks found.<br />Use <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded font-sans">/</kbd> to insert decisions, tasks, or risks.</p>
                    </div>
                ) : (
                    blocks.map((block, idx) => (
                        <div
                            key={idx}
                            onClick={() => onJumpTo(block.pos)}
                            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all hover:shadow-lg group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {getIcon(block.type)}
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{block.type}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${block.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    block.status === 'superseded' ? 'bg-gray-100 text-gray-500' :
                                        'bg-indigo-50 text-indigo-500'
                                    }`}>
                                    {block.status || 'pending'}
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed font-medium">
                                {block.text || <span className="italic opacity-50">Empty content</span>}
                            </p>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold">
                                        {block.ownerName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-[10px] text-gray-400">{block.ownerName || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-indigo-600 group-hover:translate-x-1 transition-transform font-bold">
                                    Jump to <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Nudge */}
            <div className="p-6 bg-indigo-600 text-white rounded-t-[32px] shadow-2xl">
                <h4 className="font-bold flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" /> Team Health
                </h4>
                <p className="text-[11px] opacity-80 leading-relaxed font-medium">
                    {stats.pendingAcks > 0
                        ? `You have ${stats.pendingAcks} team members with outstanding alignment debt. Nudging them can help restore momentum.`
                        : "Everyone is aligned! Your document momentum is at peak performance."}
                </p>
                {stats.pendingAcks > 0 && (
                    <button
                        data-testid="nudge-button"
                        onClick={() => onSendNudge(stats.waitingUsers)}
                        className="mt-4 w-full bg-white text-indigo-600 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-900/20 active:scale-95 transition-transform"
                    >
                        Send Alignment Nudge
                    </button>
                )}
            </div>
        </div>
    );
};
