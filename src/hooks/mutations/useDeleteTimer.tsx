import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';

interface DeleteTimer {
  timerId: string;
}

export const useDeleteTimer = () => {
  const queryClient = useQueryClient();
  const { data: roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId }: DeleteTimer) => {
      const { error } = await supabase.rpc('delete_timer', {
        _timer_id: timerId,
      });

      if (error) throw new Error(error.message);
      return { timerId };
    },

    onMutate: async ({ timerId }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).filter((timer) => timer.id !== timerId);
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
