import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'


export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]

        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 overflow-y-auto max-h-[330px] min-w-[280px] p-1 scale-95 animate-in fade-in zoom-in duration-100">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors ${index === selectedIndex
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className={`w-8 h-8 rounded border flex items-center justify-center ${index === selectedIndex
                            ? 'bg-white dark:bg-zinc-800 border-indigo-200 dark:border-indigo-800 shadow-sm'
                            : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'
                            }`}>
                            {item.icon}
                        </div>
                        <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-[10px] text-gray-400 dark:text-zinc-500">{item.description}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            )}
        </div>
    )
})

CommandList.displayName = 'CommandList'
