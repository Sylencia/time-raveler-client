import { PostgrestError } from '@supabase/supabase-js';

interface OptimisticUpdateParams {
  optimisticAction: () => void;
  rollbackAction: () => void;
  mutation: () => Promise<{ error: PostgrestError | null }>;
}

export const handleOptimisticUpdate = async ({
  optimisticAction,
  rollbackAction,
  mutation,
}: OptimisticUpdateParams): Promise<boolean> => {
  optimisticAction();

  const { error } = await mutation();
  console.log(error);

  if (error) {
    rollbackAction();
    console.error(error.message);
    return false;
  }

  return true;
};
