import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'lib/supabase';
import { toast } from 'sonner';

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_room');

      if (error) {
        toast.error(error.message, {
          style: {
            background: 'var(--red)',
            border: 'var(--maroon)',
          },
        });
        throw new Error(error.message);
      }

      return data[0];
    },
    onSuccess: (roomData) => {
      queryClient.setQueryData(['joined-room'], roomData);
    },
  });
};
