import { RoomAccess, RoomMode } from 'types/RoomTypes';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RoomState {
  roomId: string;
  editRoomId: string;
  viewOnlyRoomId: string;
  mode: RoomMode;
  actions: RoomActions;
}

interface RoomActions {
  updateRoomId: (roomId: string) => void;
  updateEditRoomId: (editRoomId: string) => void;
  updateViewRoomId: (viewOnlyRoomId: string) => void;
  updateMode: (mode: RoomAccess) => void;
  clearRoom: () => void;
}

const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      roomId: '',
      editRoomId: '',
      viewOnlyRoomId: '',
      mode: RoomAccess.NONE,
      actions: {
        updateRoomId: (roomId) => set({ roomId }),
        updateEditRoomId: (editRoomId) => set({ editRoomId }),
        updateViewRoomId: (viewOnlyRoomId) => set({ viewOnlyRoomId }),
        updateMode: (mode) => set({ mode }),
        clearRoom: () => set({ editRoomId: '', viewOnlyRoomId: '', mode: RoomAccess.NONE }),
      },
    }),
    {
      name: 'room-store',
      partialize: (state) => ({
        roomId: state.roomId,
        editRoomId: state.editRoomId,
        viewOnlyRoomId: state.viewOnlyRoomId,
      }),
    },
  ),
);

export const useRoomId = () => useRoomStore((state) => state.roomId);
export const useEditRoomId = () => useRoomStore((state) => state.editRoomId);
export const useViewRoomId = () => useRoomStore((state) => state.viewOnlyRoomId);
export const useRoomMode = () => useRoomStore((state) => state.mode);
export const useRoomActions = () => useRoomStore((state) => state.actions);
