import { Home, Clock, Users, Trash, Settings, LogOut, Folder as FolderIcon, Plus, Trash2, Pencil, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, memo } from "react";
import { folderService, type Folder } from "../../services/folder-service";
import { tagService, type Tag } from "../../services/tag-service";
import { documentService } from "../../services/document-service";
import { useUserStore } from "../../store/useUserStore";
import { useDragStore } from "../../store/useDragStore";
import PremiumModal from "../PremiumModal";
import { FolderDeleteModal } from "./FolderDeleteModal";
import { RenameModal } from "./RenameModal";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";
import { WorkspaceSelector } from "./WorkspaceSelector";
import { clsx } from "clsx";

//const logo = "/logo_1.png";

//const logo = "/logo_1.png";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}


const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Clock, label: "Recents", path: "/recents" },
    { icon: Users, label: "Shared", path: "/shared" },
    { icon: Trash, label: "Trash", path: "/trash" },
];

export const Sidebar = memo(function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const location = useLocation();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    // Modal states
    const [folderDeleteModal, setFolderDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string; documentCount: number }>({
        isOpen: false,
        id: null,
        name: "",
        documentCount: 0
    });
    const [folderRenameModal, setFolderRenameModal] = useState<{ isOpen: boolean; id: string | null; name: string; color?: string }>({
        isOpen: false,
        id: null,
        name: "",
        color: undefined
    });

    // Loading states for actions
    const [isDeletingFolder, setIsDeletingFolder] = useState(false);
    const [isRenamingFolder, setIsRenamingFolder] = useState(false);

    const { user } = useUserStore();

    // Drag & Drop state
    const { draggedId, isDragging, clearDraggedItem } = useDragStore();
    const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
    const { currentWorkspaceId, setWorkspaceId } = useWorkspaceStore();

    const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

    const loadData = useCallback(async () => {
        try {
            const [foldersData, tagsData] = await Promise.all([
                folderService.getAll(currentWorkspaceId || undefined),
                tagService.getAll()
            ]);
            setFolders(foldersData);
            setTags(tagsData);
        } catch (error) {
            console.error("Failed to load sidebar data", error);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const handleCreateFolder = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        // Enforce 5 folder limit for non-premium users
        if (!user?.isPremium && folders.length >= 5) {
            setShowPremiumModal(true);
            setIsCreatingFolder(false);
            setNewFolderName("");
            return;
        }

        try {
            await folderService.create(newFolderName.trim(), undefined, currentWorkspaceId || undefined);
            setNewFolderName("");
            setIsCreatingFolder(false);
            loadData();
        } catch (error) {
            console.error("Failed to create folder", error);
        }
    }, [newFolderName, user?.isPremium, folders.length, currentWorkspaceId, loadData]);

    const handleDeleteFolder = useCallback((id: string, name: string, documentCount: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFolderDeleteModal({ isOpen: true, id, name, documentCount });
    }, []);

    const confirmDeleteFolder = useCallback(async (deleteDocuments: boolean) => {
        if (!folderDeleteModal.id) return;

        setIsDeletingFolder(true);
        try {
            await folderService.delete(folderDeleteModal.id, deleteDocuments);
            setFolderDeleteModal({ isOpen: false, id: null, name: "", documentCount: 0 });
            loadData();
        } catch (error) {
            console.error("Failed to delete folder", error);
        } finally {
            setIsDeletingFolder(false);
        }
    }, [folderDeleteModal.id, loadData]);

    const handleRenameFolder = useCallback((id: string, name: string, color: string | undefined, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFolderRenameModal({ isOpen: true, id, name, color });
    }, []);

    const confirmRenameFolder = useCallback(async (newName: string, color?: string) => {
        if (!folderRenameModal.id) return;

        setIsRenamingFolder(true);
        try {
            await folderService.update(folderRenameModal.id, newName, color);
            setFolderRenameModal({ isOpen: false, id: null, name: "", color: undefined });
            loadData();
        } catch (error) {
            console.error("Failed to rename folder", error);
        } finally {
            setIsRenamingFolder(false);
        }
    }, [folderRenameModal.id, loadData]);

    const handleDropOnFolder = useCallback(async (folderId: string) => {
        if (!draggedId) return;

        setDragOverFolder(null);
        try {
            await documentService.update(draggedId, { folderId });
            loadData(); // Re-fetch counts (e.g. document count in folder)
            clearDraggedItem();
        } catch (error) {
            console.error("Failed to move document via drag & drop", error);
        }
    }, [draggedId, loadData, clearDraggedItem]);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 h-screen bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 
                flex flex-col transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col items-center justify-center gap-3 mb-8">
                        {/* <div className="w-10 h-10 flex items-center justify-center">
                        <img src={logo} alt="CollabDocs" className="w-full h-full object-contain" />
                    </div> */}
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-400">
                            CollabDocs
                        </span>
                    </div>

                    <WorkspaceSelector
                        currentWorkspaceId={currentWorkspaceId}
                        onWorkspaceChange={setWorkspaceId}
                    />

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        )
                        )}

                        {/* Folders Section */}
                        <div className="pt-6 pb-2 px-4">
                            <div className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                                    Folders
                                </span>
                                <button
                                    onClick={() => setIsCreatingFolder(true)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {isCreatingFolder && (
                            <form onSubmit={handleCreateFolder} className="px-4 py-2">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                                    placeholder="Folder Name..."
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 transition-all"
                                />
                            </form>
                        )}

                        {folders.map((folder) => (
                            <Link
                                key={folder.id}
                                to={`/folder/${folder.id}`}
                                onMouseEnter={() => isDragging && setDragOverFolder(folder.id)}
                                onMouseLeave={() => setDragOverFolder(null)}
                                onMouseUp={() => isDragging && handleDropOnFolder(folder.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group/folder ${isActive(`/folder/${folder.id}`)
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : dragOverFolder === folder.id
                                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 scale-105 shadow-sm"
                                        : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FolderIcon
                                        className={`w-4 h-4 transition-transform ${dragOverFolder === folder.id ? 'scale-125' : ''}`}
                                        style={{ color: folder.color || undefined }}
                                    />
                                    <span className="truncate max-w-[120px]">{folder.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {folder._count?.documents !== undefined && folder._count.documents > 0 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-md text-gray-500 dark:text-zinc-400 font-bold group-hover/folder:bg-white dark:group-hover/folder:bg-zinc-700">
                                            {folder._count.documents}
                                        </span>
                                    )}
                                    <div className="flex items-center opacity-0 group-hover/folder:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => handleRenameFolder(folder.id, folder.name, folder.color, e)}
                                            className="p-1 hover:text-indigo-500 transition-all rounded"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteFolder(folder.id, folder.name, folder._count?.documents || 0, e)}
                                            className="p-1 hover:text-red-500 transition-all rounded"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Tags Section */}
                        {tags.length > 0 && (
                            <>
                                <div className="pt-6 pb-2 px-4">
                                    <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                                        Tags
                                    </span>
                                </div>
                                {tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        to={`/tag/${tag.id}`}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(`/tag/${tag.id}`)
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                                            }`}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: tag.color || '#6366f1' }}
                                        />
                                        <span className="truncate max-w-[150px]">{tag.name}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-200 dark:border-zinc-800 space-y-1">
                    {currentWorkspaceId && (
                        <Link
                            to={`/workspace/${currentWorkspaceId}/settings`}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-all duration-200",
                                isActive(`/workspace/${currentWorkspaceId}/settings`)
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                            )}
                        >
                            <Settings className="w-5 h-5 text-indigo-500" />
                            Workspace Settings
                        </Link>
                    )}
                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-all duration-200 ${isActive("/settings")
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200"
                            }`}
                    >
                        <User className="w-5 h-5" />
                        Account Settings
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/auth';
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 mt-1"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
                {showPremiumModal && <PremiumModal setShowPremiumModal={setShowPremiumModal as any} />}

                <FolderDeleteModal
                    isOpen={folderDeleteModal.isOpen}
                    onClose={() => setFolderDeleteModal({ ...folderDeleteModal, isOpen: false })}
                    onConfirm={confirmDeleteFolder}
                    folderName={folderDeleteModal.name}
                    documentCount={folderDeleteModal.documentCount}
                    isDeleting={isDeletingFolder}
                />

                <RenameModal
                    isOpen={folderRenameModal.isOpen}
                    onClose={() => setFolderRenameModal({ ...folderRenameModal, isOpen: false })}
                    onConfirm={confirmRenameFolder}
                    initialTitle={folderRenameModal.name}
                    initialColor={folderRenameModal.color}
                    isRenaming={isRenamingFolder}
                    type="folder"
                />
            </div>
        </>
    );
});
