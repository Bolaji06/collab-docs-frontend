
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, ArrowRight, X } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    highlightSelector?: string;
}

const steps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to CollabDocs',
        description: 'The first "Operating System" for team thinking. Let\'s get you set up for peak alignment.',
        icon: <Zap className="w-8 h-8 text-indigo-500" />
    },
    {
        id: 'blocks',
        title: 'Collaboration Blocks',
        description: 'Type "/" to insert Decisions, Tasks, or Risks directly into your text. This is how you build momentum.',
        icon: <Zap className="w-8 h-8 text-amber-500" />,
        highlightSelector: '.tiptap'
    },
    {
        id: 'nudges',
        title: 'Alignment Nudges',
        description: 'Someone quiet? Send a Nudge. It\'s not a ping; it\'s a signal that their input is critical.',
        icon: <Users className="w-8 h-8 text-indigo-500" />,
        highlightSelector: '[data-testid="nudge-button"]'
    }
];

export function OnboardingOverlay() {
    const { user, completeOnboarding } = useUserStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            setIsVisible(true);
        }
    }, [user]);

    if (!isVisible) return null;

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = async () => {
        if (isLastStep) {
            await completeOnboarding();
            setIsVisible(false);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-xs pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-8 pointer-events-auto"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
                            {step.icon}
                        </div>
                        <button
                            onClick={() => {
                                completeOnboarding();
                                setIsVisible(false);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {step.title}
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 mb-8 leading-relaxed">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-gray-200 dark:bg-zinc-800'
                                        }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            {isLastStep ? 'Start Collaborating' : 'Next'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* Optional: Highlight Pulse for the selector */}
                {step.highlightSelector && (
                    <HighlightPulse selector={step.highlightSelector} />
                )}
            </div>
        </AnimatePresence>
    );
}

function HighlightPulse({ selector }: { selector: string }) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const updateRect = () => {
            const el = document.querySelector(selector);
            if (el) setRect(el.getBoundingClientRect());
        };
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [selector]);

    if (!rect) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed z-99 border-4 border-indigo-500 rounded-lg pointer-events-none"
            style={{
                top: rect.top - 8,
                left: rect.left - 8,
                width: rect.width + 16,
                height: rect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.3), 0 0 20px rgba(99,102,241,0.5)'
            }}
        >
            <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-indigo-500 rounded-lg"
            />
        </motion.div>
    );
}
