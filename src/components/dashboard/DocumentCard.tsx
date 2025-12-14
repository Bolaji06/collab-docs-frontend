
import { FileText, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface DocumentCardProps {
    title: string;
    lastEdited: string;
    icon?: React.ReactNode;
}

export function DocumentCard({ title, lastEdited, icon }: DocumentCardProps) {
    return (
        <motion.div
            whileHover={{ y: -2, scale: 1.01 }}
            className="group p-5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                    {icon || <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                {title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Last edited {lastEdited}</span>
            </div>
        </motion.div>
    );
}
