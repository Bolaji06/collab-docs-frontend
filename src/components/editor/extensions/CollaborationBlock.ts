import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CollaborationBlockView } from './CollaborationBlockView';

export interface CollaborationBlockOptions {
    HTMLAttributes: Record<string, any>;
    users: any[];
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        collaborationBlock: {
            setCollaborationBlock: (attributes: {
                type: 'decision' | 'task' | 'question' | 'note' | 'risk' | 'assumption',
                status?: string
            }) => ReturnType;
        };
    }
}

export const CollaborationBlock = Node.create<CollaborationBlockOptions>({
    name: 'collaborationBlock',

    group: 'block',

    content: 'block+',

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'collaboration-block',
            },
            users: [],
        };
    },

    addAttributes() {
        return {
            type: {
                default: 'decision', // decision, task, question, note, risk, assumption
                parseHTML: element => element.getAttribute('data-type'),
                renderHTML: attributes => ({
                    'data-type': attributes.type,
                    class: `collaboration-block collaboration-block-${attributes.type}`,
                }),
            },
            status: {
                default: 'pending',
                parseHTML: element => element.getAttribute('data-status'),
                renderHTML: attributes => ({
                    'data-status': attributes.status,
                }),
            },
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => ({
                    'data-id': attributes.id,
                }),
            },
            ownerId: {
                default: null,
                parseHTML: element => element.getAttribute('data-owner-id'),
                renderHTML: attributes => ({
                    'data-owner-id': attributes.ownerId,
                }),
            },
            ownerName: {
                default: null,
                parseHTML: element => element.getAttribute('data-owner-name'),
                renderHTML: attributes => ({
                    'data-owner-name': attributes.ownerName,
                }),
            },
            acknowledgments: {
                default: [],
                parseHTML: element => {
                    const data = element.getAttribute('data-acknowledgments');
                    return data ? JSON.parse(data) : [];
                },
                renderHTML: attributes => ({
                    'data-acknowledgments': JSON.stringify(attributes.acknowledgments),
                }),
            },
            history: {
                default: [],
                parseHTML: element => {
                    const data = element.getAttribute('data-history');
                    return data ? JSON.parse(data) : [];
                },
                renderHTML: attributes => ({
                    'data-history': JSON.stringify(attributes.history),
                }),
            },
            isLocked: {
                default: false,
                parseHTML: element => element.getAttribute('data-is-locked') === 'true',
                renderHTML: attributes => ({
                    'data-is-locked': attributes.isLocked,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CollaborationBlockView);
    },

    addCommands() {
        return {
            setCollaborationBlock:
                attributes =>
                    ({ chain }) => {
                        const label = attributes.type.charAt(0).toUpperCase() + attributes.type.slice(1);
                        return chain()
                            .insertContent({
                                type: this.name,
                                attrs: {
                                    ...attributes,
                                    id: crypto.randomUUID(),
                                },
                                content: [
                                    {
                                        type: 'paragraph',
                                        content: [
                                            {
                                                type: 'text',
                                                text: `${label}: `,
                                            },
                                        ],
                                    },
                                ],
                            })
                            .focus()
                            .run();
                    },
        };
    },
});
