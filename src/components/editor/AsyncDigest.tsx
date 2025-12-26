import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, X, CheckCircle2, ListTodo, ArrowRight } from 'lucide-react';
import { aiService } from '../../services/ai-service';
import { useUserStore } from '../../store/useUserStore';

interface AsyncDigestProps {
    editor: any;
    documentId: string;
    intent: string;
    onClose: () => void;
}

export const AsyncDigest: React.FC<AsyncDigestProps> = ({ editor, documentId, intent, onClose }) => {
    const { user } = useUserStore();
    const [summary, setSummary] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const activityData = useMemo(() => {
        if (!editor) return null;

        const lastVisitTime = localStorage.getItem(`collabdocs_last_visit_${documentId}`);
        const lastTime = lastVisitTime ? parseInt(lastVisitTime) : 0;

        const blocks: any[] = [];
        editor.state.doc.descendants((node: any) => {
            if (node.type.name === 'collaborationBlock') {
                blocks.push(node.attrs);
            }
        });

        const newBlocks = blocks.filter(b => b.history && b.history.some((h: any) => h.timestamp > lastTime));
        const pendingAcks = blocks.filter(b =>
            (b.type === 'decision' || b.type === 'task') &&
            b.status !== 'superseded' &&
            (!b.acknowledgments || !b.acknowledgments.some((ack: any) => ack.userId === user?.id))
        );

        return {
            newBlocks,
            pendingAcks,
            totalBlocks: blocks.length
        };
    }, [editor, documentId, user]);

    useEffect(() => {
        const generateSummary = async () => {
            if (!activityData || (activityData.newBlocks.length === 0 && activityData.pendingAcks.length === 0)) {
                return;
            }

            setIsLoading(true);
            try {
                const myBlocks = activityData.newBlocks.filter(b => b.ownerId === user?.id);
                const activityText = activityData.newBlocks
                    .map(b => `${b.type.toUpperCase()} was updated to ${b.status}.`)
                    .join(' ') +
                    ` There are ${activityData.pendingAcks.length} items waiting for your acknowledgement.` +
                    (myBlocks.length > 0 ? ` Note: ${myBlocks.length} items you OWN were updated.` : "");

                const response = await aiService.generateActivityDigest(activityText, intent);
                setSummary(response.result);
            } catch (err) {
                console.error("Failed to generate digest", err);
                setSummary("The team has been busy! Check out the new decisions and tasks below.");
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();
    }, [activityData]);

    if (!activityData || (activityData.newBlocks.length === 0 && activityData.pendingAcks.length === 0 && !isLoading)) {
        return null;
    }

    return (
        <div className="bg-indigo-600/95 dark:bg-indigo-700/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-6 text-white border border-white/20 relative overflow-hidden group animate-in slide-in-from-bottom-6 fade-in duration-700">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">While you were away...</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10">
                {isLoading ? (
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-3/4 bg-white/20 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-white/20 rounded animate-pulse" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            {summary}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {activityData.newBlocks.length > 0 && (
                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/10">
                                    <div className="text-xl font-bold mb-0.5">{activityData.newBlocks.length}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-70 tracking-tight">Recent Updates</div>
                                </div>
                            )}
                            {activityData.pendingAcks.length > 0 && (
                                <div className="bg-emerald-500/20 backdrop-blur-md p-3 rounded-lg border border-emerald-400/20">
                                    <div className="text-xl font-bold mb-0.5">{activityData.pendingAcks.length}</div>
                                    <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-tight">Pending Approval</div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">Key Items</h4>
                            <div className="space-y-2">
                                {activityData.pendingAcks.slice(0, 3).map((b, i) => (
                                    <div key={i} className="flex items-center justify-between group/item cursor-pointer hover:translate-x-1 transition-transform">
                                        <div className="flex items-center gap-2">
                                            {b.type === 'decision' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                                            {b.type === 'task' && <ListTodo className="w-3.5 h-3.5 text-blue-300" />}
                                            <span className="text-xs font-semibold capitalize">{b.type} waiting for you</span>
                                        </div>
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
