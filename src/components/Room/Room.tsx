import { AddTimer } from 'components/AddTimer';
import { Timer } from 'components/Timer';
import { useWebSocketContext } from 'components/WebSocketContext';
import { useUpdateTick } from 'hooks/useUpdateTick';
import { useCallback, useEffect, useState } from 'react';
import { useRoomStore } from 'stores/useRoomStore';
import { type CreateTimerMessage, type DeleteTimerMessage } from 'types/ClientMessageTypes';
import type { TimerData } from 'types/CommonTypes';
import { RoomAccess } from 'types/RoomTypes';
import {
  RoomUpdateMessage,
  TimerCreatedMessage,
  TimerDeletedMessage,
  TimerUpdateMessage,
} from 'types/ServerMessageTypes';
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
  const [timers, setTimers] = useState<Array<TimerData>>([]);
  const getRoomCode = useRoomStore((state) => state.getRoomCode);
  const mode = useRoomStore((state) => state.mode);

  useUpdateTick(1000);

  const { lastJsonMessage, sendJsonMessage } = useWebSocketContext();

  const handleRoomUpdate = useCallback(
    (data: RoomUpdateMessage) => {
      setTimers(data.timers);
    },
    [setTimers],
  );

  const handleTimerUpdate = useCallback((data: TimerUpdateMessage) => {
    setTimers((prevTimers) => prevTimers.map((timer) => (timer.id === data.timer.id ? data.timer : timer)));
  }, []);

  const handleTimerCreated = useCallback((data: TimerCreatedMessage) => {
    setTimers((prevTimers) => [...prevTimers, data.timer]);
  }, []);

  const handleTimerDeleted = useCallback((data: TimerDeletedMessage) => {
    setTimers((prevTimers) => prevTimers.filter((timer) => timer.id !== data.id));
  }, []);

  useEffect(() => {
    if (!lastJsonMessage) {
      return;
    }

    switch (lastJsonMessage.type) {
      case 'roomUpdate':
        handleRoomUpdate(lastJsonMessage);
        break;
      case 'timerUpdate':
        handleTimerUpdate(lastJsonMessage);
        break;
      case 'timerCreated':
        handleTimerCreated(lastJsonMessage);
        break;
      case 'timerDeleted':
        handleTimerDeleted(lastJsonMessage);
        break;
      default:
        return;
    }
  }, [lastJsonMessage, handleRoomUpdate, handleTimerUpdate, handleTimerCreated, handleTimerDeleted]);

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  });

  const onTimerTick = () => {
    setTimers((prevTimers) =>
      prevTimers.map((timer) => {
        if (timer.running) {
          return { ...timer, timeRemaining: timer.endTime - Date.now() };
        }
        return timer;
      }),
    );
  };

  // Timer Handlers
  const handleAddTimer = ({ eventName, rounds, roundTime, hasDraft, draftTime }: AddTimerInfo) => {
    const convertedDraftTime = convertMinutesToMilliseconds(draftTime ?? 0);
    const convertedRoundTime = convertMinutesToMilliseconds(roundTime);
    const timeRemaining = hasDraft ? convertedDraftTime : convertedRoundTime;

    sendJsonMessage({
      type: 'createTimer',
      accessId: getRoomCode(),
      timer: {
        id: generateRandomId(10),
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
          : Math.max(timer.hasDraft ? 0 : 1, timer.currentRoundNumber - 1);
      const newTimer = { ...timer, currentRoundNumber: newRoundNumber, timeRemaining: timer.roundTime, running: false };

      setTimers(timers.map((t) => (t.id === id ? newTimer : t)));

      handleUpdateTimer(newTimer);
    }
  };

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
