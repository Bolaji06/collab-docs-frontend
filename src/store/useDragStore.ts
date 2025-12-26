import { create } from 'zustand';

interface DragState {
    draggedId: string | null;
    draggedTitle: string | null;
    draggedType: 'document' | 'folder' | null;
    isDragging: boolean;
    setDraggedItem: (id: string | null, title: string | null, type?: 'document' | 'folder') => void;
    clearDraggedItem: () => void;
}

export const useDragStore = create<DragState>((set) => ({
    draggedId: null,
    draggedTitle: null,
    draggedType: null,
    isDragging: false,
    setDraggedItem: (id, title, type = 'document') => set({
        draggedId: id,
        draggedTitle: title,
        draggedType: type,
        isDragging: !!id
    }),
    clearDraggedItem: () => set({
        draggedId: null,
        draggedTitle: null,
        draggedType: null,
        isDragging: false
    }),
}));
