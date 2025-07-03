// hooks/useRoomTimersRealtime.ts
import { supabase } from 'lib/supabase';
import { useEffect } from 'react';
import { useRoomId } from 'stores/useRoomStore';
import { useTimerActions } from 'stores/useRoomTimersStore';
import { type Database } from 'types/supabase';

type TimerData = Database['public']['Tables']['timers']['Row'];

export const useRoomTimersRealtime = () => {
  const roomId = useRoomId();
  const { fetchTimers, setTimers } = useTimerActions();

  useEffect(() => {
    fetchTimers(roomId);
  }, [fetchTimers, roomId]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`timers-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timers',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          setTimers((prev) => {
            switch (eventType) {
              case 'INSERT':
                return [...prev, newRow as TimerData];
              case 'UPDATE':
                return prev.map((t) => (t.id === (newRow as TimerData).id ? (newRow as TimerData) : t));
              case 'DELETE':
                return prev.filter((t) => t.id !== (oldRow as TimerData).id);
              default:
                return prev;
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, setTimers]);
};
