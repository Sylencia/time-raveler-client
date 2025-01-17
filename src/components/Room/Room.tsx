import { AddTimer } from 'components/AddTimer';
import { Timer } from 'components/Timer';
import { useUpdateTick } from 'hooks/useUpdateTick';
import { useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useRoomStore } from 'stores/useRoomStore';
import { RoomAccess, type CreateTimerMessage, type DeleteTimerMessage, type TimerData } from 'types/ClientMessageTypes';
import { generateRandomId } from 'utils/generateRandomId';
import { convertMinutesToMilliseconds } from 'utils/timeUtils';
import './Room.css';

interface AddTimerInfo {
  eventName: string;
  rounds: number;
  roundTime: number;
  hasDraft: boolean;
  draftTime: number;
}

export const Room = () => {
  const didUnmount = useRef(false);
  const [timers, setTimers] = useState<Array<TimerData>>([]);
  const getRoomCode = useRoomStore((state) => state.getRoomCode);
  const mode = useRoomStore((state) => state.mode);

  useUpdateTick(1000);

  const { sendJsonMessage } = useWebSocket(import.meta.env.VITE_WS_URL!, {
    share: true,
    shouldReconnect: () => didUnmount.current === false,
    reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    onMessage: (message) => {
      const messageData: string = message.data;

      try {
        const data = JSON.parse(messageData);

        if (data.type === 'roomUpdate') {
          handleRoomUpdate(data.timers);
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    },
  });

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  // Timer Handlers

  const handleAddTimer = ({ eventName, rounds, roundTime, hasDraft, draftTime }: AddTimerInfo) => {
    const convertedDraftTime = convertMinutesToMilliseconds(draftTime ?? 0);
    const convertedRoundTime = convertMinutesToMilliseconds(roundTime);
    const timeRemaining = hasDraft ? convertedDraftTime : convertedRoundTime;

    sendJsonMessage({
      type: 'createTimer',
      accessId: getRoomCode(),
      timer: {
        id: generateRandomId(),
        endTime: Date.now() + timeRemaining,
        timeRemaining,
        running: false,
        eventName,
        rounds,
        roundTime: convertedRoundTime,
        hasDraft,
        draftTime: convertedDraftTime,
        currentRoundNumber: hasDraft ? 0 : 1,
        currentRoundLength: timeRemaining,
      },
    } as CreateTimerMessage);
  };

  const handleRoomUpdate = (timers: Array<TimerData>) => {
    setTimers(timers);
  };

  const handleUpdateTimer = (timer: TimerData) => {
    sendJsonMessage({
      type: 'updateTimer',
      accessId: getRoomCode(),
      timer,
    });
  };

  const handleRemoveTimer = (id: string) => {
    setTimers(timers.filter((timer) => timer.id !== id));

    sendJsonMessage({
      type: 'deleteTimer',
      accessId: getRoomCode(),
      id,
    } as DeleteTimerMessage);
  };

  const handleToggleTimer = (id: string) => {
    const timer = timers.find((timer) => timer.id === id);

    if (timer) {
      const newTimer = {
        ...timer,
        running: !timer.running,
      };

      if (newTimer.running) {
        const newEndTime = Date.now() + timer.timeRemaining;
        newTimer.endTime = newEndTime;
      } else {
        const newTimeRemaining = timer.endTime - Date.now();
        newTimer.timeRemaining = newTimeRemaining;
      }

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

  const handleAdjustTime = (id: string, amount: number) => {
    const timer = timers.find((timer) => timer.id === id);

    if (timer) {
      const newTimeRemaining = timer.timeRemaining + amount;
      const newEndTime = Date.now() + newTimeRemaining;
      const newTimer = { ...timer, timeRemaining: newTimeRemaining, endTime: newEndTime };

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

  const handleAdjustRounds = (id: string, amount: number) => {
    const timer = timers.find((timer) => timer.id === id);

    if (timer) {
      const newTimer = { ...timer, rounds: Math.max(0, timer.rounds + amount) };

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

  const handleChangeRounds = (id: string, direction: 'next' | 'previous') => {
    const timer = timers.find((timer) => timer.id === id);

    if (timer) {
      const newRoundNumber =
        direction === 'next'
          ? Math.min(timer.rounds, timer.currentRoundNumber + 1)
          : Math.max(1, timer.currentRoundNumber - 1);
      const newTimer = { ...timer, currentRoundNumber: newRoundNumber, timeRemaining: timer.roundTime, running: false };

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

  // TODO: Debounce this as it can change fast
  const handleUpdateEventName = (id: string, eventName: string) => {
    const timer = timers.find((timer) => timer.id === id);

    if (timer) {
      const newTimer = { ...timer, eventName };

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

  return (
    <>
      {timers.length === 0 ? (
        <div className="no-timers-msg">No timers added yet.</div>
      ) : (
        <div className="timer-stack">
          {timers.map((timer) => (
            <Timer
              key={timer.id}
              timerData={timer}
              onRemoveTimer={handleRemoveTimer}
              onToggleTimer={handleToggleTimer}
              onAdjustTime={handleAdjustTime}
              onAdjustRounds={handleAdjustRounds}
              onChangeRound={handleChangeRounds}
              onUpdateEventName={handleUpdateEventName}
            />
          ))}
        </div>
      )}

      {mode === RoomAccess.EDIT && <AddTimer onAddTimer={handleAddTimer} />}
    </>
  );
};
