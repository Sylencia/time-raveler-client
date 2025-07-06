import { useEffect, useRef, useState } from 'react';
import { TimerData } from 'stores/useRoomTimersStore';

export const useEventTimeCalculator = (timerState: TimerData) => {
  const initialTimeRemaining = timerState.is_running
    ? new Date(timerState.end_time).getTime() - Date.now()
    : timerState.time_remaining;
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(initialTimeRemaining);
  const [eventFinishTime, setEventFinishTime] = useState(
    Date.now() +
      (timerState.rounds - timerState.current_round_number) * timerState.round_time +
      Math.max(0, initialTimeRemaining),
  );

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
