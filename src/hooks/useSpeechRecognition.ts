import { useState, useEffect, useRef } from 'react';


export interface UseSpeechRecognitionReturn {
    isListening: boolean;
    isPaused: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    pauseListening: () => void;
    resetTranscript: () => void;
    hasRecognitionSupport: boolean;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const hasRecognitionSupport = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        if (!hasRecognitionSupport) return;

        // Initialize recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // For now, we just update with the latest. 
            // In a real app, we might want to distinguish final vs interim
            // But usually we just want to show what's being said.
            // Actually, for the editor integration, we might want to just expose the *latest final* chunk
            // or the full accumulated transcript.

            // Let's rely on the consumer to handle "committing" text if they want.
            // Or here, we just accumulate.

            // Simpler approach for "Typing":
            // Just update the transcript state.
            if (finalTranscript) {
                setTranscript(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const [isPaused, setIsPaused] = useState(false);

    const startListening = () => {
        setIsPaused(false);
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Start error", e);
            }
        }
    };

    const stopListening = () => {
        setIsPaused(false);
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const pauseListening = () => {
        if (document.visibilityState === 'hidden') {
            // If tab hidden, logic might differ, but for now just stop
        }
        setIsPaused(true);
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };

    const resetTranscript = () => {
        setTranscript('');
        setIsPaused(false);
    };

    return {
        isListening,
        isPaused,
        transcript,
        startListening,
        stopListening,
        pauseListening,
        resetTranscript,
        hasRecognitionSupport
    };
};
