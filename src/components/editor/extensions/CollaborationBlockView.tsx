import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useMemo, useState } from 'react';
import {
    CheckCircle2, ListTodo, HelpCircle, Lightbulb, Check,
    Unlock, Send, AlertCircle, AlertTriangle, Brain, UserMinus,
    Lock, UserCheck, History
} from 'lucide-react';
import { useUserStore } from '../../../store/useUserStore';

export const CollaborationBlockView = (props: any) => {
    const { node, updateAttributes, editor, extension } = props;
    const { type, acknowledgments = [], status, history = [], isLocked } = node.attrs;
    const { user } = useUserStore();
    const users = extension?.options?.users || [];

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPromptingReason, setIsPromptingReason] = useState(false);
    const [reasonText, setReasonText] = useState("");

    const isAcknowledgedByMe = useMemo(() => {
        if (!user) return false;
        return acknowledgments.some((ack: any) => ack.userId === user.id);
    }, [acknowledgments, user]);

    const waitingForUsers = useMemo(() => {
        if (!users.length) return [];
        return users.filter((u: { id: any; }) => !acknowledgments.some((ack: any) => ack.userId === u.id));
    }, [users, acknowledgments]);

    const handleAcknowledge = () => {
        if (!user || isAcknowledgedByMe) return;

        const newAck = {
            userId: user.id,
            userName: user.username || user.email.split('@')[0],
            timestamp: Date.now(),
        };

        updateAttributes({
            acknowledgments: [...acknowledgments, newAck],
        });
    };

    const handleStatusChange = (newStatus: string) => {
        if (!user) return;

        const historyEntry = {
            status: newStatus,
            oldStatus: status,
            reason: `Status changed to ${newStatus}`,
            updatedBy: user.username || user.email.split('@')[0],
            timestamp: Date.now(),
        };

        updateAttributes({
            status: newStatus,
            isLocked: newStatus === 'approved',
            history: [...history, historyEntry]
        });
    };

    const startEditingApproved = () => {
        setIsPromptingReason(true);
    };

    const confirmEditing = () => {
        if (!user || !reasonText.trim()) return;

        const historyEntry = {
            status: status,
            reason: `Manual edit: ${reasonText}`,
            updatedBy: user.username || user.email.split('@')[0],
            timestamp: Date.now(),
        };

        updateAttributes({
            isLocked: false,
            history: [...history, historyEntry]
        });

        setIsPromptingReason(false);
        setReasonText("");
    };

    const getIcon = () => {
        switch (type) {
            case 'decision': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'task': return <ListTodo className="w-5 h-5 text-blue-500" />;
            case 'question': return <HelpCircle className="w-5 h-5 text-amber-500" />;
            case 'note': return <Lightbulb className="w-5 h-5 text-purple-500" />;
            case 'risk': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            case 'assumption': return <Brain className="w-5 h-5 text-cyan-500" />;
            default: return null;
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'proposed': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case 'approved': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
            case 'superseded': return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
            default: return 'text-gray-400 bg-gray-50 dark:bg-zinc-800';
        }
    };

    const showAckButton = (type === 'decision' || type === 'task') && status !== 'superseded';

    return (
        <NodeViewWrapper className={`collaboration-block collaboration-block-${type} ${status === 'superseded' ? 'opacity-60 grayscale-[0.5]' : ''} group transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {getIcon()}
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {type}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <select
                            value={status || 'proposed'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={!editor.isEditable}
                            className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors ${getStatusColor(status || 'proposed')}`}
                        >
                            <option value="proposed">Proposed</option>
                            <option value="approved">Approved</option>
                            <option value="superseded">Superseded</option>
                        </select>

                        {isLocked && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                Locked
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {showAckButton && (
                        <button
                            onClick={handleAcknowledge}
                            disabled={isAcknowledgedByMe || !editor.isEditable}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${isAcknowledgedByMe
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white'
                                } disabled:opacity-80`}
                        >
                            {isAcknowledgedByMe ? (
                                <><Check className="w-3.5 h-3.5" /> Acknowledged</>
                            ) : (
                                <><UserCheck className="w-3.5 h-3.5" /> Acknowledge</>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className={`p-1.5 rounded-lg transition-colors ${isHistoryOpen ? 'bg-gray-200 dark:bg-zinc-700' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                        title="History"
                    >
                        <History className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="relative group/content">
                {isLocked && editor.isEditable && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover/content:opacity-100 transition-opacity rounded-md">
                        <button
                            onClick={startEditingApproved}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                        >
                            <Unlock className="w-3.5 h-3.5" />
                            Edit Approved decision
                        </button>
                    </div>
                )}
                <div className={`relative min-h-6 ${status === 'superseded' ? 'line-through decoration-gray-400' : ''}`}>
                    <NodeViewContent className="outline-none" />
                </div>
            </div>

            {/* Friction Prompt */}
            {isPromptingReason && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">Reason for change required</span>
                    </div>
                    <textarea
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        placeholder="Why is this decision being updated?"
                        className="w-full bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={() => { setIsPromptingReason(false); setReasonText(""); }}
                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmEditing}
                            disabled={!reasonText.trim()}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Confirm Change
                        </button>
                    </div>
                </div>
            )}

            {/* History Timeline */}
            {isHistoryOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        Decision Timeline
                    </h4>

                    <div className="space-y-4 ml-2 border-l border-gray-200 dark:border-zinc-800 pl-4">
                        {history.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No history yet</p>
                        ) : (
                            [...history].reverse().map((entry: any, idx: number) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900" />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 capitalize">{entry.updatedBy}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                        {entry.reason && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded-lg italic">
                                                "{entry.reason}"
                                            </p>
                                        )}
                                        {entry.status && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getStatusColor(entry.status)}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Acknowledgments */}
            {acknowledgments.length > 0 && !isHistoryOpen && (
                <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-zinc-700/50 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-medium mr-1 uppercase tracking-tighter">Seen by</span>
                    <div className="flex -space-x-1.5">
                        {acknowledgments.map((ack: any, idx: number) => (
                            <div
                                key={idx}
                                title={`${ack.userName} acknowledged at ${new Date(ack.timestamp).toLocaleTimeString()}`}
                                className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 capitalize transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                            >
                                {ack.userName.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] text-gray-400 italic">
                        {acknowledgments.length} member{acknowledgments.length !== 1 ? 's' : ''}
                    </span>

                    {/* Waiting For Badges */}
                    {waitingForUsers.length > 0 && (
                        <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                                <UserMinus className="w-3 h-3" /> Waiting for:
                            </span>
                            <div className="flex -space-x-2">
                                {waitingForUsers.slice(0, 3).map((u: any, idx: number) => (
                                    <div
                                        key={idx}
                                        title={`Waiting for ${u.name} to acknowledge`}
                                        className="w-5 h-5 rounded-full bg-gray-100 dark:bg-zinc-800 border-[1.5px] border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-bold text-gray-400 dark:text-gray-500 capitalize transition-all hover:scale-110 grayscale-[0.5] opacity-60"
                                    >
                                        {u.name.charAt(0)}
                                    </div>
                                ))}
                                {waitingForUsers.length > 3 && (
                                    <div className="text-[9px] text-gray-400 font-bold ml-1">+{waitingForUsers.length - 3}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </NodeViewWrapper>
    );
};
