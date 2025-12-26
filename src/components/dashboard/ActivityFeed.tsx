import { useEffect, useState } from 'react';
import { activityService } from '../../services/activity-service';
import type { Activity } from '../../services/activity-service';
import { formatDistanceToNow } from 'date-fns';
import {
    FileText,
    Folder,
    MessageSquare,
    Share2,
    Tag as TagIcon,
    Clock,
    X,
    User,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFeedProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ActivityFeed({ isOpen, onClose }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadActivities = async () => {
        setIsLoading(true);
        try {
            const data = await activityService.getLatestActivities();
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadActivities();
        }
    }, [isOpen]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'DOC_CREATE':
            case 'DOC_RENAME':
            case 'DOC_UPDATE':
            case 'DOC_DELETE':
                return <FileText className="w-4 h-4 text-blue-500" />;
            case 'FOLD_CREATE':
            case 'FOLD_RENAME':
            case 'FOLD_DELETE':
                return <Folder className="w-4 h-4 text-amber-500" />;
            case 'COMMENT':
            case 'COMMENT_REPLY':
                return <MessageSquare className="w-4 h-4 text-emerald-500" />;
            case 'DOC_SHARE':
                return <Share2 className="w-4 h-4 text-indigo-500" />;
            case 'TAG_CREATE':
            case 'TAG_ADD':
                return <TagIcon className="w-4 h-4 text-purple-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActivityText = (activity: Activity) => {
        const { type, user, details, document } = activity;
        const name = user.username === 'me' ? 'You' : user.username;

        switch (type) {
            case 'DOC_CREATE':
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> created document
                        <span className="font-medium text-indigo-600 dark:text-indigo-400"> "{details?.title || document?.title || 'Untitled'}"</span>
                    </p>
                );
            case 'DOC_RENAME':
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> renamed
                        <span className="italic"> "{details?.oldTitle}"</span> to
                        <span className="font-medium text-indigo-600 dark:text-indigo-400"> "{details?.newTitle}"</span>
                    </p>
                );
            case 'FOLD_CREATE':
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> created folder
                        <span className="font-medium text-amber-600 dark:text-amber-400"> "{details?.folderName}"</span>
                    </p>
                );
            case 'COMMENT':
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> commented on
                        <span className="font-medium text-emerald-600 dark:text-emerald-400"> "{document?.title}"</span>:
                        <span className="text-gray-500 italic block mt-1 line-clamp-1">"{details?.content}"</span>
                    </p>
                );
            case 'DOC_SHARE':
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> shared
                        <span className="font-medium text-indigo-600 dark:text-indigo-400"> "{details?.title}"</span> with
                        <span className="font-bold">{details?.email}</span> as {details?.role}
                    </p>
                );
            default:
                return (
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="font-bold text-gray-900 dark:text-white">{name}</span> performed <span className="lowercase">{type.replace('_', ' ')}</span>
                    </p>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-80 md:w-96 bg-white dark:bg-zinc-900 shadow-2xl z-[101] flex flex-col border-l border-gray-200 dark:border-zinc-800"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                Recent Activity
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadActivities}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {isLoading && activities.length === 0 ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
                                                <div className="h-3 bg-gray-100 dark:bg-zinc-800/50 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-gray-500 dark:text-zinc-400 font-medium">No recent activity found</p>
                                </div>
                            ) : (
                                <div className="space-y-8 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-100 dark:bg-zinc-800" />

                                    {activities.map((activity, idx) => (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex gap-4 relative"
                                        >
                                            <div className="relative z-10">
                                                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shadow-sm overflow-hidden text-zinc-400">
                                                    {activity.user.avatar ? (
                                                        <img src={activity.user.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                            </div>

                                            <div className="flex-1 pt-0.5">
                                                {getActivityText(activity)}
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
