import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Database } from 'types/supabase';

interface RoomInfo {
  room_id: string;
  access_level: Database['public']['Enums']['access_level_enum'];
  edit_code: string;
  read_code: string;
}

export const useRoomInfo = () => {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | undefined>(undefined);

  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === 'joined-room') {
        const data = queryClient.getQueryData<RoomInfo>(['joined-room']);
        setRoomInfo(data || undefined);
      }
    });

    const initialData = queryClient.getQueryData<RoomInfo>(['joined-room']);
    setRoomInfo(initialData || undefined);

    return unsubscribe;
  }, [queryClient]);

  return { roomInfo };
};
