import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';

interface PauseTimer {
  timerId: string;
  pauseTime: string;
  optimisticTimeRemaining: number;
}

export const usePauseTimer = () => {
  const queryClient = useQueryClient();
  const { roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId, pauseTime, optimisticTimeRemaining }: PauseTimer) => {
      const { error } = await supabase.rpc('pause_timer', {
        _timer_id: timerId,
        _pause_time: pauseTime,
      });

      if (error) throw new Error(error.message);
      return { timerId, optimisticTimeRemaining };
    },

    onMutate: async ({ timerId, optimisticTimeRemaining }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).map((timer) =>
          timer.id === timerId ? { ...timer, time_remaining: optimisticTimeRemaining, is_running: false } : timer,
        );
      });

      return { previousTimers };
    },

    onError: (_, __, context) => {
      if (context?.previousTimers && roomId) {
        queryClient.setQueryData(timersQueryKey(roomId), context.previousTimers);
      }
    },

    onSettled: () => {
      if (roomId) {
        queryClient.invalidateQueries({ queryKey: timersQueryKey(roomId) });
      }
    },
  });
};
