import { Pause, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";

interface VoiceControlWidgetProps {
    isListening: boolean;
    isPaused: boolean;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
}

export function VoiceControlWidget({ isListening, isPaused, onPause, onResume, onStop }: VoiceControlWidgetProps) {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isListening && !isPaused) {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } else if (!isListening) {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isListening, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isListening && !isPaused) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-full px-4 py-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 dark:border-zinc-700">
                <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200">
                    {isPaused ? 'Paused' : formatTime(duration)}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
                {isPaused ? (
                    <button
                        onClick={onResume}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors"
                        title="Resume"
                    >
                        <Play className="w-4 h-4 fill-current" />
                    </button>
                ) : (
                    <button
                        onClick={onPause}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full text-gray-700 dark:text-gray-200 transition-colors"
                        title="Pause"
                    >
                        <Pause className="w-4 h-4 fill-current" />
                    </button>
                )}

                <button
                    onClick={onStop}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-red-600 dark:text-red-400 transition-colors"
                    title="Stop"
                >
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>
        </div>
    );
}
