import { useEffect, useMemo, useRef, useState } from 'react';
import { TimerData } from 'types/commonTypes';

export const useEventTimeCalculator = (timerState: TimerData) => {
  const { initialRemaining, initialFinishTime } = useMemo(() => {
    const { is_running, end_time, time_remaining, rounds, current_round_number, round_time } = timerState;

    const now = Date.now();
    const remaining = is_running ? new Date(end_time).getTime() - now : time_remaining;
    const estimatedFinishTime = now + (rounds - current_round_number) * round_time + Math.max(0, remaining);

    return {
      initialRemaining: remaining,
      initialFinishTime: estimatedFinishTime,
    };
  }, [timerState]);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(initialRemaining);
  const [eventFinishTime, setEventFinishTime] = useState(initialFinishTime);

  const stateRef = useRef(timerState);

  useEffect(() => {
    stateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    const onTimerTick = () => {
      const { is_running, end_time, time_remaining, rounds, current_round_number, round_time } = stateRef.current;

      const now = Date.now();
      const remaining = is_running ? new Date(end_time).getTime() - now : time_remaining;

      const estimatedFinishTime = now + (rounds - current_round_number) * round_time + Math.max(0, remaining);

      setRoundTimeRemaining(remaining);
      setEventFinishTime(estimatedFinishTime);
    };

    window.addEventListener('timerTick', onTimerTick);
    return () => window.removeEventListener('timerTick', onTimerTick);
  }, []);

  return { roundTimeRemaining, eventFinishTime };
};
