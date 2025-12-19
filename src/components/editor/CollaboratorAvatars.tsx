import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import { SocketIOProvider } from 'y-socket.io';

interface CollaboratorAvatarsProps {
    provider: SocketIOProvider | null;
    editor: Editor | null;
    user: {
        name: string;
        color: string;
    };
}

interface AwarenessState {
    clientId: number;
    user: {
        name: string;
        color: string;
    };
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
            {collaborators.slice(0, 5).map(({ clientId, user }) => (
                <div
                    key={clientId}
                    className="relative group cursor-pointer"
                    onClick={() => handleJumpToUser(clientId)}
                >
                    <div
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-xs font-medium text-white shadow-sm transition-transform hover:scale-110 hover:z-10"
                        style={{ backgroundColor: user.color }}
                    >
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                        {user.name}
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
