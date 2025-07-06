// hooks/useRoomTimersRealtime.ts
import { supabase } from 'lib/supabase';
import { useEffect } from 'react';
import { useRoomId } from 'stores/useRoomStore';
import { useTimerActions } from 'stores/useRoomTimersStore';
import { type Database } from 'types/supabase';

type TimerData = Database['public']['Tables']['timers']['Row'];

export const useRoomTimersRealtime = () => {
  const roomId = useRoomId();
  const { fetchTimers, addTimer, updateTimer, deleteTimer } = useTimerActions();

  useEffect(() => {
    fetchTimers(roomId);

    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handleWake = () => {
      if (roomId) fetchTimers(roomId);
    };

    window.addEventListener('focus', handleWake);

    return () => {
      window.removeEventListener('focus', handleWake);
    };
  }, [roomId, fetchTimers]);

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

          switch (eventType) {
            case 'INSERT':
              return addTimer(newRow as TimerData);
            case 'UPDATE': {
              const updatedRow = newRow as TimerData;
              return updateTimer(updatedRow.id, updatedRow);
            }
            case 'DELETE':
              return deleteTimer((oldRow as TimerData).id);
            default:
              console.warn('unknown event type');
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, addTimer, updateTimer, deleteTimer]);
};
