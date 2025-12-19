import React, { useState } from 'react';
import { X, Trash2, User, Mail, Shield, Check, Loader, Globe, Lock, Link as LinkIcon } from 'lucide-react';
import { documentService } from '../services/document-service';

interface ShareDialogProps {
    open: boolean;
    onClose: () => void;
    documentId: string;
    permissions: any[];
    onPermissionsChange: () => void;
    currentUserEmail?: string;
    ownerEmail?: string;
    isPublic: boolean;
    publicRole?: 'VIEWER' | 'EDITOR' | null;
}

export function ShareDialog(props: ShareDialogProps) {
    const { open, onClose, documentId, permissions, onPermissionsChange, currentUserEmail, ownerEmail } = props;
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null);

    if (!open) return null;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await documentService.share(documentId, email, role);
            setSuccessMessage(`Document shared with ${email}`);
            setEmail('');
            onPermissionsChange();
        } catch (err: any) {
            setError(err.message || 'Failed to share document');
        } finally {
            setLoading(false);
        }
    };

    const confirmRemove = async () => {
        if (!userToDelete) return;

        try {
            await documentService.removePermission(documentId, userToDelete.id);
            setSuccessMessage(`Removed access for ${userToDelete.email}`);
            setUserToDelete(null);
            onPermissionsChange();
        } catch (err: any) {
            setError(err.message || 'Failed to remove user');
        }
    };

    const handleRemoveClick = (userId: string, userEmail: string) => {
        setError(null);
        setSuccessMessage(null);
        setUserToDelete({ id: userId, email: userEmail });
    };

    const isOwner = currentUserEmail === ownerEmail;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Document</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {userToDelete ? (
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Are you sure you want to remove access for <span className="font-semibold text-amber-900 dark:text-amber-100">{userToDelete.email}</span>?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemove}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Remove Access
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Share Form */}
                        <form onSubmit={handleShare} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                    Add people
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                                        className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    {successMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Share'}
                            </button>
                        </form>

                        <div className="h-px bg-gray-200 dark:bg-zinc-800" />

                        {/* General Access */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                                General Access
                            </h3>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500">
                                        {props.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <select
                                            value={props.isPublic ? 'PUBLIC' : 'RESTRICTED'}
                                            onChange={async (e) => {
                                                const isPublic = e.target.value === 'PUBLIC';
                                                try {
                                                    await documentService.updateAccess(documentId, isPublic, isPublic ? 'VIEWER' : null);
                                                    setSuccessMessage(isPublic ? 'Anyone with the link can now view' : 'Access restricted');
                                                    onPermissionsChange();
                                                } catch (err: any) {
                                                    setError(err.message || 'Failed to update access');
                                                }
                                            }}
                                            className="bg-transparent border-none p-0 text-sm font-medium text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                                        >
                                            <option value="RESTRICTED">Restricted</option>
                                            <option value="PUBLIC">Anyone with the link</option>
                                        </select>
                                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                                            {props.isPublic ? 'Anyone on the internet with this link can view' : 'Only people with access can open with the link'}
                                        </p>
                                    </div>
                                </div>
                                {props.isPublic && (
                                    <select
                                        value={props.publicRole || 'VIEWER'}
                                        onChange={async (e) => {
                                            try {
                                                await documentService.updateAccess(documentId, true, e.target.value as 'VIEWER' | 'EDITOR');
                                                onPermissionsChange();
                                            } catch (err: any) {
                                                setError(err.message || 'Failed to update role');
                                            }
                                        }}
                                        className="text-xs bg-transparent border-none p-0 text-gray-500 dark:text-zinc-500 focus:ring-0 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>
                                )}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/document/${documentId}`);
                                        setSuccessMessage('Link copied to clipboard');
                                        setTimeout(() => setSuccessMessage(null), 2000);
                                    }}
                                    className="px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium flex items-center gap-2"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    Copy Link
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-zinc-800" />

                        {/* Permissions List */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
                                People with access
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {/* Owner */}
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {ownerEmail || 'Owner'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-500">
                                                Owner
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Collaborators */}
                                {permissions.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {p.user.avatar ? (
                                                <img src={p.user.avatar} alt={p.user.username} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {p.user.email}
                                                </p>
                                                {isOwner ? (
                                                    <select
                                                        value={p.role}
                                                        onChange={async (e) => {
                                                            const newRole = e.target.value as 'EDITOR' | 'VIEWER';
                                                            try {
                                                                // Clear previous messages
                                                                setSuccessMessage(null);
                                                                await documentService.share(documentId, p.user.email, newRole);
                                                                onPermissionsChange();
                                                                setSuccessMessage(`Updated ${p.user.email} to ${newRole.toLowerCase()}`);
                                                            } catch (err: any) {
                                                                setError(err.message || 'Failed to update role');
                                                            }
                                                        }}
                                                        className="mt-1 text-xs bg-transparent border-none p-0 text-gray-500 dark:text-zinc-500 focus:ring-0 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                                                    >
                                                        <option value="VIEWER">Viewer</option>
                                                        <option value="EDITOR">Editor</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-xs text-gray-500 dark:text-zinc-500 capitalize">
                                                        {p.role.toLowerCase()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveClick(p.userId, p.user.email)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Remove access"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {permissions.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-zinc-500 text-center py-4">
                                        No one else has access to this document.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
