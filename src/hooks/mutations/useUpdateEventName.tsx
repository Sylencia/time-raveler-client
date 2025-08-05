import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';
import type { TimerData } from 'types/commonTypes';
import { timersQueryKey } from 'utils/queryKeys';

interface UpdateEventName {
  timerId: string;
  newName: string;
}

export const useUpdateEventName = () => {
  const queryClient = useQueryClient();
  const { data: roomInfo } = useRoomInfo();
  const roomId = roomInfo?.room_id || '';

  return useMutation({
    mutationFn: async ({ timerId, newName }: UpdateEventName) => {
      const { error } = await supabase.rpc('change_event_name', {
        _timer_id: timerId,
        _name: newName,
      });

      if (error) throw new Error(error.message);
      return { timerId, newName };
    },

    onMutate: async ({ timerId, newName }) => {
      await queryClient.cancelQueries({ queryKey: timersQueryKey(roomId) });
      const previousTimers = queryClient.getQueryData(timersQueryKey(roomId));

      queryClient.setQueryData(timersQueryKey(roomId), (oldData: TimerData[] | undefined) => {
        return (oldData || []).map((timer) => (timer.id === timerId ? { ...timer, event_name: newName } : timer));
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
