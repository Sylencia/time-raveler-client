import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';
import { adjustIsoTime } from 'utils/timeUtils';

interface AdjustEndTime {
  timerId: string;
  timeAdjustment: number;
}

export const useAdjustEndTime = () => {
  const queryClient = useQueryClient();
  const { roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId, timeAdjustment }: AdjustEndTime) => {
      const { error } = await supabase.rpc('update_end_time', {
        _timer_id: timerId,
        _time_modifier: timeAdjustment,
      });

      if (error) throw new Error(error.message);
      return { timerId, timeAdjustment };
    },

    onMutate: async ({ timerId, timeAdjustment }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).map((timer) =>
          timer.id === timerId
            ? {
                ...timer,
                end_time: adjustIsoTime(timer.end_time, timeAdjustment),
              }
            : timer,
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
