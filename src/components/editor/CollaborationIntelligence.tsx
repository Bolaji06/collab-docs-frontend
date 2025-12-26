import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Users, Activity, MessageSquare } from 'lucide-react';
import { aiService } from '../../services/ai-service';
import { commentService } from '../../services/comment-service';
import ReactMarkdown from 'react-markdown';

interface CollaborationIntelligenceProps {
    documentId: string;
    documentContent: string;
    editor: any;
    intent: string;
}

export const CollaborationIntelligence: React.FC<CollaborationIntelligenceProps> = ({ documentId, documentContent, editor, intent }) => {
    const [insights, setInsights] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [momentum, setMomentum] = useState<{ score: number; stats: any }>({ score: 0, stats: {} });

    const collaborationData = useMemo(() => {
        if (!editor) return null;

        const blocks: any[] = [];
        editor.state.doc.descendants((node: any) => {
            if (node.type.name === 'collaborationBlock') {
                blocks.push(node.attrs);
            }
        });

        const total = blocks.length;
        const acknowledged = blocks.filter(b => b.acknowledgments && b.acknowledgments.length > 0).length;
        const approved = blocks.filter(b => b.status === 'approved').length;

        const score = total > 0 ? Math.round(((acknowledged + approved) / (total * 2)) * 100) : 100;

        return {
            total,
            acknowledged,
            approved,
            score,
            blocks
        };
    }, [editor]);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            try {
                const comments = await commentService.getAll(documentId);
                const response = await aiService.analyzeCollaboration({
                    content: documentContent,
                    comments: comments.map(c => ({ content: c.content, replies: c.replies.length, resolved: c.resolved, outcome: c.outcome })),
                    intent
                });
                setInsights(response.result);
                if (collaborationData) {
                    setMomentum({ score: collaborationData.score, stats: collaborationData });
                }
            } catch (err) {
                console.error("Failed to fetch intelligence", err);
                setInsights("AI is still processing document dynamics. Check back soon for conflict detection and risk analysis.");
            } finally {
                setIsLoading(false);
            }
        };

        if (documentId) fetchInsights();
    }, [documentId, documentContent, collaborationData]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950">
            <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
                {/* Momentum Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Activity className="w-16 h-16" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Momentum Score</h3>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">{momentum.score}%</span>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-0.5">
                            High Alignment
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-6">
                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{momentum.stats.total || 0}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">Items</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{momentum.stats.acknowledged || 0}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">Acknowledged</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-gray-100 dark:border-zinc-800">
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{momentum.stats.approved || 0}</div>
                            <div className="text-[9px] uppercase font-bold text-gray-400">Approved</div>
                        </div>
                    </div>
                </div>

                {/* AI Insights Card */}
                <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Collaboration Intelligence</h3>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3 relative z-10">
                            <div className="h-3 bg-white/20 rounded animate-pulse w-full" />
                            <div className="h-3 bg-white/20 rounded animate-pulse w-3/4" />
                            <div className="h-3 bg-white/20 rounded animate-pulse w-5/6" />
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-indigo-50 relative z-10">
                            <ReactMarkdown>{insights}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Health Signals */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Health Signals</h4>

                    {/* Volatility Detection */}
                    {collaborationData && collaborationData.blocks.some((b: any) => (b.history?.length || 0) > 2) && (
                        <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex items-start gap-3 animate-in fade-in slide-in-from-right-2">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Decision Volatility</div>
                                <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                                    High churn on approved items. Consider moving back to <b>Brainstorm</b> mode.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Alignment Debt Signal */}
                    {collaborationData && collaborationData.score < 50 && intent === 'decision' && (
                        <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 flex items-start gap-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg shrink-0">
                                <Users className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Alignment Debt</div>
                                <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                                    Critical blockers unacknowledged. Team momentum is at risk.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-3 flex items-start gap-3 transition-colors hover:border-indigo-200 dark:hover:border-indigo-900/50">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg shrink-0">
                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Discussion Convergence</div>
                            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                                Efficiency is high. Most long threads are resulting in documented outcomes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
