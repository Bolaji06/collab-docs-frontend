import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { SocketIOProvider } from 'y-socket.io';

interface CollaboratorAvatarsProps {
    provider: SocketIOProvider | null;
    editor: Editor | null;
    user: {
        name: string;
        color: string;
        avatar?: string;
    };
}

interface AwarenessState {
    clientId: number;
    user: {
        name: string;
        color: string;
        avatar?: string;
    };
    isTyping?: boolean;
}

export function CollaboratorAvatars({ provider, editor }: CollaboratorAvatarsProps) {
    const [collaborators, setCollaborators] = useState<AwarenessState[]>([]);

    useEffect(() => {
        if (!provider) return;

        const awareness = provider.awareness;

        const updateCollaborators = () => {
            const states = awareness.getStates();
            const active: AwarenessState[] = [];

            states.forEach((state: any, clientId: number) => {
                // Filter out self and users without user data or color
                if (state.user && state.user.name && clientId !== awareness.clientID) {
                    active.push({
                        clientId,
                        user: state.user,
                        isTyping: !!state.isTyping,
                    });
                }
            });

            setCollaborators(active);
        };

        updateCollaborators();

        awareness.on('change', updateCollaborators);

        return () => {
            awareness.off('change', updateCollaborators);
        };
    }, [provider]);

    const handleJumpToUser = (clientId: number) => {
        if (!editor || !provider) return;

        const state = provider.awareness.getStates().get(clientId);
        if (state && state.cursor) {
            const { head } = state.cursor;

            try {
                const { node } = editor.view.domAtPos(head);
                const element = node.nodeType === 3 ? node.parentElement : node as HTMLElement;

                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (e) {
                console.error("Failed to jump to user cursor", e);
            }
        }
    };

    if (collaborators.length === 0) return null;

    return (
        <div className="flex items-center -space-x-2 mr-4">
            {collaborators.slice(0, 5).map(({ clientId, user, isTyping }) => (
                <div
                    key={clientId}
                    className="relative group cursor-pointer"
                    onClick={() => handleJumpToUser(clientId)}
                >
                    <div
                        className={`w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-medium text-white shadow-sm transition-all duration-300 hover:scale-110 hover:z-10 overflow-hidden relative ${isTyping ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900 animate-pulse' : ''}`}
                        style={{ backgroundColor: user.color }}
                    >
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                        {isTyping && (
                            <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 whitespace-nowrap pointer-events-none z-20 border border-gray-100 dark:border-zinc-700 flex flex-col items-center">
                        <span>{user.name}</span>
                        {isTyping && <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-medium">Writing...</span>}
                    </div>
                </div>
            ))}
            {collaborators.length > 5 && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 text-xs font-medium text-gray-500 dark:text-gray-400 shadow-sm ml-2">
                    +{collaborators.length - 5}
                </div>
            )}
        </div>
    );
}
