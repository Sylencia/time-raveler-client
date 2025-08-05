import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';

interface StartTimer {
  timerId: string;
  startTime: string;
  optimisticEndTime: string;
}

export const useStartTimer = () => {
  const queryClient = useQueryClient();
  const { roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId, startTime, optimisticEndTime }: StartTimer) => {
      const { error } = await supabase.rpc('start_timer', {
        _timer_id: timerId,
        _start_time: startTime,
      });

      if (error) throw new Error(error.message);
      return { timerId, optimisticEndTime };
    },

    onMutate: async ({ timerId, optimisticEndTime }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).map((timer) =>
          timer.id === timerId ? { ...timer, end_time: optimisticEndTime, is_running: true } : timer,
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
