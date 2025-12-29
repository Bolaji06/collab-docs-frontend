
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowUpRight,
    Target,
    Activity,
    Brain,
    TrendingUp
} from 'lucide-react';
import { type Document } from '../../services/document-service';

interface WorkspaceIntelligenceProps {
    documents: Document[];
}

export const WorkspaceIntelligence = ({ documents }: WorkspaceIntelligenceProps) => {
    const stats = useMemo(() => {
        let unacknowledgedRisks = 0;
        let unacknowledgedDecisions = 0;
        let totalDecisions = 0;
        let totalRisks = 0;
        let totalBrainstorms = 0;
        let totalExecution = 0;

        const traverse = (node: any) => {
            if (!node) return;
            if (node.type === 'collaborationBlock') {
                const { type, acknowledgments = [] } = node.attrs;
                const isAcknowledged = acknowledgments.length > 0;

                if (type === 'risk') {
                    totalRisks++;
                    if (!isAcknowledged) unacknowledgedRisks++;
                }
                if (type === 'decision') {
                    totalDecisions++;
                    if (!isAcknowledged) unacknowledgedDecisions++;
                }
            }
            if (node.content && Array.isArray(node.content)) {
                node.content.forEach(traverse);
            }
        };

        documents.forEach(doc => {
            if (doc.content) {
                traverse(doc.content);
            }
            if (doc.intent === 'brainstorm') totalBrainstorms++;
            if (doc.intent === 'execute') totalExecution++;
        });

        const momentumScore = totalDecisions > 0
            ? Math.round(((totalDecisions - unacknowledgedDecisions) / totalDecisions) * 100)
            : 100;

        return {
            unacknowledgedRisks,
            unacknowledgedDecisions,
            totalDecisions,
            totalRisks,
            totalBrainstorms,
            totalExecution,
            momentumScore
        };
    }, [documents]);

    const cards = [
        {
            title: "Alignment Momentum",
            value: `${stats.momentumScore}%`,
            subtitle: "Decisions acknowledged",
            icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            title: "Open Risks",
            value: stats.unacknowledgedRisks,
            subtitle: "Require attention",
            icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
            color: "text-rose-600",
            bg: "bg-rose-50 dark:bg-rose-900/20"
        },
        {
            title: "Active Brainstorms",
            value: stats.totalBrainstorms,
            subtitle: "Ideation phase",
            icon: <Brain className="w-5 h-5 text-amber-500" />,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        },
        {
            title: "Execution Units",
            value: stats.totalExecution,
            subtitle: "In implementation",
            icon: <Activity className="w-5 h-5 text-blue-500" />,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        }
    ];

    return (
        <section className="my-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                        Workspace Intelligence
                    </h2>
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    BETA
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl ${card.bg}`}>
                                {card.icon}
                            </div>
                            <button className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <ArrowUpRight className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mt-1">{card.title}</span>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{card.subtitle}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
