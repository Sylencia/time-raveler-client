import { Database } from 'types/supabase';

export type TimerData = Database['public']['Tables']['timers']['Row'];
