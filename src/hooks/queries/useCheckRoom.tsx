import { useQuery } from '@tanstack/react-query';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { supabase } from 'lib/supabase';

export const useCheckRoom = () => {
  const { roomInfo } = useRoomInfo();

  return useQuery({
    queryKey: ['check-room', roomInfo?.room_id ?? 'empty'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_room_code', {
        room_code: roomInfo!.room_id,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!roomInfo?.room_id,
    staleTime: 1000 * 60 * 5,
  });
};
