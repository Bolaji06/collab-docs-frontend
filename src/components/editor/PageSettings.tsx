import { Settings2, Maximize2, Layout } from 'lucide-react';

interface PageSettingsProps {
    settings: {
        width: 'standard' | 'wide' | 'full';
        background: 'white' | 'sepia' | 'zinc' | 'slate';
        fontSize: 'sm' | 'base' | 'lg' | 'xl';
    };
    onUpdate: (settings: any) => void;
}

export function PageSettings({ settings, onUpdate }: PageSettingsProps) {
    const widths = [
        { id: 'standard', label: 'Standard', icon: <Layout className="w-4 h-4" /> },
        { id: 'wide', label: 'Wide', icon: <Maximize2 className="w-4 h-4" /> },
        { id: 'full', label: 'Full', icon: <Maximize2 className="w-4 h-4" /> },
    ];

    const backgrounds = [
        { id: 'white', label: 'Pure', color: 'bg-white' },
        { id: 'sepia', label: 'Sepia', color: 'bg-[#f4ecd8]' },
        { id: 'zinc', label: 'Zinc', color: 'bg-zinc-100' },
        { id: 'slate', label: 'Slate', color: 'bg-slate-100' },
    ];

    const fontSizes = [
        { id: 'sm', label: 'Small' },
        { id: 'base', label: 'Normal' },
        { id: 'lg', label: 'Large' },
        { id: 'xl', label: 'Extra' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-semibold">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                Page Layout
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-zinc-500 mb-2 block">
                        Container Width
                    </label>
                    <div className="flex bg-gray-50 dark:bg-zinc-800 p-1 rounded-lg gap-1">
                        {widths.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => onUpdate({ ...settings, width: w.id })}
                                className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all ${settings.width === w.id
                                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {w.icon}
                                <span className="text-[10px] font-medium mt-1">{w.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-zinc-500 mb-2 block">
                        Paper Style
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {backgrounds.map((bg) => (
                            <button
                                key={bg.id}
                                onClick={() => onUpdate({ ...settings, background: bg.id })}
                                title={bg.label}
                                className={`h-8 rounded-md border-2 transition-all ${bg.color} ${settings.background === bg.id
                                    ? 'border-indigo-500 scale-110'
                                    : 'border-transparent hover:border-gray-200 dark:hover:border-zinc-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-zinc-500 mb-2 block">
                        Text Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {fontSizes.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => onUpdate({ ...settings, fontSize: f.id })}
                                className={`px-3 py-1.5 text-xs rounded-md border transition-all ${settings.fontSize === f.id
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 font-semibold'
                                    : 'border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
