import { Node, mergeAttributes } from '@tiptap/core'

export const AIStatus = Node.create({
    name: 'aiStatus',

    group: 'inline',

    inline: true,

    atom: true,

    addAttributes() {
        return {
            text: {
                default: '✨ AI is writing...',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="ai-status"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'ai-status', class: 'ai-generating' }), this.options.text || '✨ AI is writing...']
    },

    addNodeView() {
        return () => {
            const dom = document.createElement('span')
            dom.classList.add('ai-generating')
            dom.setAttribute('data-type', 'ai-status')
            dom.textContent = '✨ AI is writing...'
            return {
                dom,
            }
        }
    }
})
