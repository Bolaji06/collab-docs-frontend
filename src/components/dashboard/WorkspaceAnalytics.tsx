
import { useEffect, useState } from "react";
import { analyticsService, type WorkspaceHealth } from "../../services/analytics-service";
import { TrendingUp, AlertCircle, Users, FileText, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface WorkspaceAnalyticsProps {
    workspaceId: string;
}

export function WorkspaceAnalytics({ workspaceId }: WorkspaceAnalyticsProps) {
    const [health, setHealth] = useState<WorkspaceHealth | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (!workspaceId) {
            setIsLoading(false);
            return;
        }
        analyticsService.getWorkspaceHealth(workspaceId).then(data => {
            setHealth(data);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load analytics", err);
            setIsLoading(false);
        });

    }, [workspaceId])


    if (isLoading) return <div className="animate-pulse bg-gray-50 dark:bg-zinc-800 h-48 rounded-3xl" />;
    if (!health) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Momentum Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Momentum</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{health.momentumScore}%</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Steady Growth</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5">
                    <Activity className="w-24 h-24" />
                </div>
            </motion.div>

            {/* Alignment Debt Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Alignment Debt</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{health.alignmentDebt}</span>
                    <span className="text-[10px] font-bold text-rose-600 uppercase">Blockers Found</span>
                </div>
            </motion.div>

            {/* Participation Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Collaboration</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{health.activeMembers}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Engaged Minds</span>
                </div>
            </motion.div>

            {/* Document Velocity Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Output</h3>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{health.documentCount}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Strategic Assets</span>
                </div>
            </motion.div>
        </div>
    );
}
