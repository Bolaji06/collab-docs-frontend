import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { workspaceService } from '../../services/workspace-service';
import type { Workspace } from '../../services/workspace-service';
import {
    Users,
    Settings,
    Trash2,
    UserPlus,
    Shield,
    Loader,
    ChevronLeft,
    Mail
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUserStore } from '../../store/useUserStore';

export default function WorkspaceSettingsPage() {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useUserStore();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newName, setNewName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (workspaceId) {
            fetchWorkspace();
        }
    }, [workspaceId]);

    const fetchWorkspace = async () => {
        setIsLoading(true);
        try {
            const data = await workspaceService.getWorkspaceById(workspaceId!);
            setWorkspace(data);
            setNewName(data.name);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !newName.trim()) return;
        setIsSaving(true);
        try {
            await workspaceService.updateWorkspace(workspace.id, newName);
            setWorkspace({ ...workspace, name: newName });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!workspace || !window.confirm('Are you sure you want to delete this workspace? All documents and folders will be affected.')) return;
        try {
            await workspaceService.deleteWorkspace(workspace.id);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace || !inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            // Note: In a real app, you'd send an invite email. 
            // Here we directly add by email if user exists (backend implementation detail).
            // For now, let's assume addMember takes email as implemented in service.
            const newMember = await workspaceService.addMember(workspace.id, inviteEmail);
            setWorkspace({
                ...workspace,
                members: [...(workspace.members || []), newMember]
            });
            setInviteEmail('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (memberId: string, role: 'ADMIN' | 'MEMBER') => {
        if (!workspace) return;
        try {
            const updatedMember = await workspaceService.updateMemberRole(workspace.id, memberId, role);
            setWorkspace({
                ...workspace,
                members: workspace.members?.map(m => m.id === memberId ? updatedMember : m)
            });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!workspace || !window.confirm('Remove this member?')) return;
        try {
            await workspaceService.removeMember(workspace.id, memberId);
            setWorkspace({
                ...workspace,
                members: workspace.members?.filter(m => m.id !== memberId)
            });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const isOwner = workspace?.ownerId === currentUser?.id;
    const isAdmin = workspace?.members?.find(m => m.userId === currentUser?.id)?.role === 'ADMIN';

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !workspace) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center text-red-500">
                    <p className="text-lg font-semibold">{error || 'Workspace not found'}</p>
                    <button onClick={() => navigate('/')} className="mt-4 text-indigo-500 hover:underline">
                        Go back Home
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Settings className="w-8 h-8 text-indigo-500" />
                            Workspace Settings
                        </h1>
                        <p className="text-gray-500 dark:text-zinc-400">
                            Management for <span className="font-semibold text-gray-700 dark:text-gray-200">{workspace.name}</span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {/* General Settings */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
                            <h2 className="font-semibold text-gray-900 dark:text-white">General Information</h2>
                        </div>
                        <form onSubmit={handleUpdateWorkspace} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                    Workspace Name
                                </label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    disabled={!isOwner}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                                />
                            </div>
                            {isOwner && (
                                <button
                                    type="submit"
                                    disabled={isSaving || newName === workspace.name}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Members Management */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Team Members</h2>
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="p-6">
                            {(isAdmin || isOwner) && (
                                <form onSubmit={handleInviteMember} className="flex gap-2 mb-8">
                                    <div className="flex-1 relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="Member email address..."
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInviting || !inviteEmail}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Invite
                                    </button>
                                </form>
                            )}

                            <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
                                {workspace.members?.map((member) => (
                                    <div key={member.id} className="py-4 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border border-gray-200 dark:border-zinc-700">
                                                {member.user.avatar ? (
                                                    <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.user.username.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {member.user.username}
                                                    {member.userId === workspace.ownerId && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded uppercase font-bold">
                                                            Owner
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-zinc-400">{member.user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Shield className={clsx(
                                                    "w-4 h-4",
                                                    member.role === 'ADMIN' ? "text-indigo-500" : "text-gray-400"
                                                )} />
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleUpdateRole(member.id, e.target.value as any)}
                                                    disabled={!isAdmin || member.userId === workspace.ownerId || member.userId === currentUser?.id}
                                                    className="bg-transparent text-sm font-medium text-gray-700 dark:text-zinc-300 border-none focus:ring-0 cursor-pointer disabled:cursor-default"
                                                >
                                                    <option value="MEMBER">Member</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>

                                            {(isAdmin || member.userId === currentUser?.id) && member.userId !== workspace.ownerId && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    {isOwner && (
                        <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-red-100 dark:border-red-900/30">
                                <h2 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-medium">
                                    Permanently delete this workspace and all its contents. This action cannot be undone.
                                </p>
                                <button
                                    onClick={handleDeleteWorkspace}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                                >
                                    Delete Workspace
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
