import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';

interface PreviousRound {
  timerId: string;
}

export const usePreviousRound = () => {
  const queryClient = useQueryClient();
  const { data: roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId }: PreviousRound) => {
      const { error } = await supabase.rpc('previous_round', {
        _timer_id: timerId,
      });

      if (error) throw new Error(error.message);
      return { timerId };
    },

    onMutate: async ({ timerId }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).map((timer) => {
          if (timer.id !== timerId) {
            return timer;
          }

          const newRound = timer.current_round_number - 1;
          const time = timer.has_draft && newRound === 0 ? timer.draft_time! : timer.round_time;

          return {
            ...timer,
            current_round_number: newRound,
            time_remaining: time,
            is_running: false,
          };
        });
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
