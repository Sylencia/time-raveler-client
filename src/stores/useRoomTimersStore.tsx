// stores/useRoomTimersStore.ts
import { supabase } from 'lib/supabase';
import { type Database } from 'types/supabase';
import { create } from 'zustand';

type TimerData = Database['public']['Tables']['timers']['Row'];

interface TimerState {
  timers: TimerData[];
  loading: boolean;
  actions: TimerActions;
}

interface TimerActions {
  fetchTimers: (roomId: string) => void;
  setTimers: (fn: (prev: TimerData[]) => TimerData[]) => void;
  updateTimer: (id: string, update: Partial<TimerData>) => void;
  clearTimers: () => void;
}

const useRoomTimersStore = create<TimerState>((set) => ({
  timers: [],
  loading: false,

  actions: {
    fetchTimers: async (roomId) => {
      set({ loading: true });
      const { data, error } = await supabase.from('timers').select('*').eq('room_id', roomId);

      if (error) {
        console.error('Failed to fetch timers:', error);
        set({ timers: [], loading: false });
        return;
      }

      set({ timers: data, loading: false });
    },

    setTimers: (fn) => {
      set((state) => ({ timers: fn(state.timers) }));
    },

    updateTimer: (id, update) => {
      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? { ...t, ...update } : t)),
      }));
    },

    clearTimers: () => {
      set({ timers: [] });
    },
  },
}));

export const useTimers = () => useRoomTimersStore((state) => state.timers);
export const useLoadingTimers = () => useRoomTimersStore((state) => state.loading);
export const useTimerActions = () => useRoomTimersStore((state) => state.actions);
