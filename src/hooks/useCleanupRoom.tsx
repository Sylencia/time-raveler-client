import { useQueryClient } from '@tanstack/react-query';

export const useCleanupRoom = () => {
  const queryClient = useQueryClient();

  const cleanupRoom = () => {
    queryClient.removeQueries({ queryKey: ['timers'] });
    queryClient.removeQueries({ queryKey: ['joined-room'] });
  };

  return { cleanupRoom };
};
