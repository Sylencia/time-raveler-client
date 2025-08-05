import { useMutation } from '@tanstack/react-query';
import { supabase } from 'lib/supabase';

interface AddTimer {
  rounds: number;
  roundTime: number;
  hasDraft: boolean;
  draftTime: number;
  roomId: string;
  eventName: string;
}

export const useAddTimer = () => {
  return useMutation({
    mutationFn: async ({ rounds, roundTime, hasDraft, draftTime, roomId, eventName }: AddTimer) => {
      const { error } = await supabase.rpc('create_timer', {
        _rounds: rounds,
        _round_time: roundTime,
        _has_draft: hasDraft,
        _draft_time: draftTime,
        _room_id: roomId,
        _event_name: eventName,
      });

      if (error) {
        throw new Error(error.message);
      }

      return;
    },
  });
};
