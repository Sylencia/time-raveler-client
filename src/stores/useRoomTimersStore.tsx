// stores/useRoomTimersStore.ts
import { supabase } from 'lib/supabase';
import { toast } from 'sonner';
import { type Database } from 'types/supabase';
import { create } from 'zustand';

export type TimerData = Database['public']['Tables']['timers']['Row'];

interface TimerState {
  timers: TimerData[];
  loading: boolean;
  isInitialLoad: boolean;
  actions: TimerActions;
}

interface TimerActions {
  fetchTimers: (roomId: string) => void;
  updateTimer: (id: string, update: Partial<TimerData>) => void;
  addTimer: (timer: TimerData) => void;
  deleteTimer: (id: string) => void;
  clearTimers: () => void;
}

const useRoomTimersStore = create<TimerState>((set, get) => ({
  timers: [],
  loading: false,
  isInitialLoad: true,

  actions: {
    fetchTimers: async (roomId: string) => {
      const fetch = async () => {
        set({ loading: true });
        const { data, error } = await supabase.from('timers').select('*').order('created_at').eq('room_id', roomId);

        if (error) {
          console.error('Failed to fetch timers:', error);
          set({ timers: [], loading: false });
          throw new Error('Failed to fetch timers');
        }

        set({ timers: data, loading: false, isInitialLoad: false });
      };

      if (!get().isInitialLoad) {
        toast.promise(fetch(), {
          loading: 'Reloading timers...',
          success: 'Timers reloaded!',
          error: 'Failed to reload timers.',
          style: {
            background: 'var(--subtext1)',
            border: 'var(--base)',
            color: 'var(--inverted-text)',
          },
        });
      } else {
        await fetch();
      }
    },

    updateTimer: (id, update) => {
      set((state) => ({
        timers: state.timers.map((t) => (t.id === id ? { ...t, ...update } : t)),
      }));
    },

    addTimer: (timer) => {
      set((state) => ({
        timers: [timer, ...state.timers],
      }));
    },

    deleteTimer: (id) => {
      set((state) => ({
        timers: state.timers.filter((t) => t.id !== id),
      }));
    },

    clearTimers: () => {
      set({ timers: [], isInitialLoad: true, loading: false });
    },
  },
}));

export const useTimers = () => useRoomTimersStore((state) => state.timers);
export const useLoadingTimers = () => useRoomTimersStore((state) => state.loading);
export const useInitialTimerLoad = () => useRoomTimersStore((state) => state.isInitialLoad);
export const useTimerActions = () => useRoomTimersStore((state) => state.actions);
