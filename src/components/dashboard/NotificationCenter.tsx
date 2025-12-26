import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink, MessageSquare, Share2, UserPlus, Info } from "lucide-react";
import { notificationService } from "../../services/notification-service";
import type { Notification } from "../../services/notification-service";
import { getSocket, joinUserRoom } from "../../services/socket-service";
import { useUserStore } from "../../store/useUserStore";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUserStore();

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        }
    };

    useEffect(() => {
        loadNotifications();

        if (user?.id) {
            joinUserRoom(user.id);
            const socket = getSocket();

            socket.on('new-notification', (notification: Notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Play a subtle sound or show a toast if needed
                if ('Notification' in window && Notification.permission === 'granted') {
                    new window.Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.ico'
                    });
                }
            });

            return () => {
                socket.off('new-notification');
            };
        }
    }, [user?.id]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'COMMENT': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'SHARE': return <Share2 className="w-4 h-4 text-green-500" />;
            case 'MENTION': return <UserPlus className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-lg transition-all"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/50">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && <span className="text-xs font-normal text-gray-500">{unreadCount} new</span>}
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50 relative group ${!notification.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notification.isRead ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'bg-gray-100 dark:bg-zinc-800'}`}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-sm leading-tight mb-0.5 ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {notification.title}
                                                            </p>
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                                    className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-full text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] text-gray-400">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                            {notification.documentId && (
                                                                <Link
                                                                    to={`/document/${notification.documentId}`}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1"
                                                                >
                                                                    View <ExternalLink className="w-2 h-2" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-center">
                                <Link
                                    to="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors"
                                >
                                    See all activity
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
