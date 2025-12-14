import { Lock } from "lucide-react";

interface IPremiumModal {
    setShowPremiumModal: (setOpen: false) => void;
}
const PremiumModal = ({ setShowPremiumModal }: IPremiumModal) => {
    const handleCloseModal = () => {
        setShowPremiumModal(false);
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                    <button
                        onClick={handleCloseModal}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Premium Feature
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            DOCX and PDF exports are available exclusively for Premium members. Upgrade now to unlock professional document formats and more!
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Export to DOCX & PDF</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited documents</span>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
                            </div>
                        </div>

                        <button className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                            Upgrade to Premium
                        </button>

                        <button
                            onClick={handleCloseModal}
                            className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </>
    )


}

export default PremiumModal