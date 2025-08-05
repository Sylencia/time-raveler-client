import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'lib/supabase';
import { useEffect } from 'react';
import type { TimerData } from 'types/commonTypes';
import { useRoomInfo } from './useRoomInfo';

const timersQueryKey = (roomId: string) => ['timers', roomId];

export const useRoomTimers = () => {
  const { roomInfo } = useRoomInfo();
  const queryClient = useQueryClient();

  // Fetch timers with optional timestamp filter
  const fetchTimers = async (roomId: string) => {
    const query = supabase.from('timers').select('*').eq('room_id', roomId).order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  };

  const {
    data: timers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: timersQueryKey(roomInfo?.room_id || ''),
    queryFn: () => {
      if (!roomInfo?.room_id) {
        throw new Error('Room ID is required');
      }

      return fetchTimers(roomInfo.room_id);
    },
    enabled: !!roomInfo?.room_id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!roomInfo?.room_id) return;

    const handleOnline = () => {
      refetch();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [roomInfo, refetch]);

  useEffect(() => {
    if (!roomInfo?.room_id) return;

    const roomId = roomInfo.room_id;

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

          // Update React Query cache based on realtime events
          queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
            switch (eventType) {
              case 'INSERT': {
                const newItem = newRow as TimerData;
                const exists = (oldData || []).some((item) => item.id === newItem.id);
                if (exists) return oldData;
                return [...(oldData || []), newItem];
              }
              case 'UPDATE': {
                const updatedItem = newRow as TimerData;
                return (oldData || []).map((item) => (item.id === updatedItem.id ? updatedItem : item));
              }
              case 'DELETE': {
                const deletedItem = oldRow as TimerData;
                return (oldData || []).filter((item) => item.id !== deletedItem.id);
              }
              default:
                console.warn('Unknown event type:', eventType);
                return oldData || [];
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomInfo, queryClient]);

  // Handle mobile wake-up scenario
  useEffect(() => {
    if (!roomInfo?.room_id) return;

    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handleWake = () => {
      refetch();
    };

    window.addEventListener('focus', handleWake);

    return () => {
      window.removeEventListener('focus', handleWake);
    };
  }, [roomInfo, refetch]);

  return { timers, isLoading, error, refetch };
};
