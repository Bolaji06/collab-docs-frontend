import { useState, useRef } from 'react';
import { X, Link as LinkIcon, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageInsertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (url: string) => void;
}

export function ImageInsertModal({ isOpen, onClose, onInsert }: ImageInsertModalProps) {
    const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            onInsert(url);
            onClose();
            setUrl('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUploadSubmit = () => {
        if (preview) {
            onInsert(preview);
            onClose();
            setPreview(null);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-indigo-500" />
                        Insert Image
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('url')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'url'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            By URL
                        </button>
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'upload'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>

                    {activeTab === 'url' ? (
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!url}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Insert Image
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${preview
                                    ? 'border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-500/10'
                                    : 'border-gray-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {preview ? (
                                    <div className="relative w-full">
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded shadow-sm object-contain"
                                        />
                                        <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                            Click to change image
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center mb-3">
                                            <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            SVG, PNG, JPG or GIF
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUploadSubmit}
                                    disabled={!preview}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Insert Image
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
