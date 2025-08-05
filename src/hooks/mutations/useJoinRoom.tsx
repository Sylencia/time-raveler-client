import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'lib/supabase';
import { toast } from 'sonner';

interface JoinRoom {
  roomCode: string;
}

export const useJoinRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomCode }: JoinRoom) => {
      const { data, error } = await supabase.rpc('join_room', {
        input_code: roomCode.toUpperCase(),
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast("Room code doesn't exist!");
        throw new Error("Room code doesn't exist!");
      }
      return data[0];
    },
    onSuccess: (roomData) => {
      queryClient.setQueryData(['joined-room'], roomData);
    },
  });
};
