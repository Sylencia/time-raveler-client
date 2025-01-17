import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { useRoomStore } from 'stores/useRoomStore';
import type { TimerData } from 'types/CommonTypes';
import { RoomAccess } from 'types/RoomTypes';
import { formatTime, formatTimestampToTime } from 'utils/timeUtils';
import './Timer.css';

interface TimerProps {
  timerData: TimerData;
  onRemoveTimer: (id: string) => void;
  onToggleTimer: (id: string) => void;
  onAdjustTime: (id: string, amount: number) => void;
  onAdjustRounds: (id: string, amount: number) => void;
  onChangeRound: (id: string, direction: 'next' | 'previous') => void;
  onUpdateEventName: (id: string, eventName: string) => void;
}

export const Timer = ({
  onRemoveTimer,
  onToggleTimer,
  onAdjustTime,
  onAdjustRounds,
  onChangeRound,
  onUpdateEventName,
  timerData,
}: TimerProps) => {
  const { id, endTime, timeRemaining, running, eventName, rounds, currentRoundNumber, hasDraft, roundTime } = timerData;
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const mode = useRoomStore((state) => state.mode);
  const [localEventName, setLocalEventName] = useState(eventName);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(running ? endTime - Date.now() : timeRemaining);
  const [eventFinishTime, setEventFinishTime] = useState<number>(
    Date.now() + (rounds - currentRoundNumber) * roundTime + Math.max(0, localTimeRemaining),
  );

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  });

  const onTimerTick = useCallback(() => {
    if (running) {
      setLocalTimeRemaining(endTime - Date.now());
    }

    setEventFinishTime(Date.now() + (rounds - currentRoundNumber) * roundTime + Math.max(0, localTimeRemaining));
  }, [endTime, running, localTimeRemaining, rounds, currentRoundNumber, roundTime]);

  const handleEventNameUpdate = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    const newName = e.target.value;
    if (newName === '') {
      setLocalEventName(eventName);
    } else {
      onUpdateEventName(id, newName);
    }
  };

  return (
    <div className={clsx('timer-container', { 'view-mode': mode === RoomAccess.VIEW_ONLY })}>
      <h2 className="timer-details-name">{eventName}</h2>
      <p className="timer-details-round">
        {currentRoundNumber === 0 ? 'Draft Time' : `Round ${currentRoundNumber}/${rounds}`}
      </p>

      {mode === RoomAccess.EDIT && (
        <div className="timer-button-container">
          <button
            className={clsx({
              'pause-button': running,
              'start-button': !running,
            })}
            onClick={() => onToggleTimer(id)}
          >
            {running ? 'Pause' : 'Start'}
          </button>

          <button disabled={currentRoundNumber === rounds} onClick={() => onChangeRound(id, 'next')}>
            Next Round
          </button>

          <Popover
            isOpen={isPopoverOpen}
            positions={['bottom', 'top']}
            padding={10}
            onClickOutside={() => setIsPopoverOpen(false)}
            content={() => (
              <div className="timer-controls">
                <input
                  className="timer-controls-name"
                  id="eventName"
                  value={localEventName}
                  onChange={(e) => setLocalEventName(e.target.value)}
                  onBlur={handleEventNameUpdate}
                />

                <div className="timer-controls-grid-4">
                  <button onClick={() => onAdjustTime(id, -5 * 60 * 1000)}>-5m</button>
                  <button onClick={() => onAdjustTime(id, -1 * 60 * 1000)}>-1m</button>
                  <button onClick={() => onAdjustTime(id, 1 * 60 * 1000)}>+1m</button>
                  <button onClick={() => onAdjustTime(id, 5 * 60 * 1000)}>+5m</button>
                </div>

                <div className="timer-controls-grid-2">
                  <button disabled={rounds <= 1} onClick={() => onAdjustRounds(id, -1)}>
                    -1 Round
                  </button>
                  <button onClick={() => onAdjustRounds(id, 1)}>+1 Round</button>
                </div>

                <div className="timer-controls-grid-2">
                  <button
                    disabled={hasDraft ? currentRoundNumber === 0 : currentRoundNumber <= 1}
                    onClick={() => onChangeRound(id, 'previous')}
                  >
                    Prev Round
                  </button>
                  <button disabled={currentRoundNumber === rounds} onClick={() => onChangeRound(id, 'next')}>
                    Next Round
                  </button>
                </div>

                <button onClick={() => onRemoveTimer(id)} className="timer-controls-end-event">
                  End Event
                </button>
              </div>
            )}
          >
            <button onClick={() => setIsPopoverOpen(!isPopoverOpen)} className="timer-button">
              Controls
            </button>
          </Popover>
        </div>
      )}

      <p className="timer-details-time">{formatTime(localTimeRemaining)}</p>
      <p className="event-finish-time">Finish: {formatTimestampToTime(eventFinishTime)}</p>
    </div>
  );
};
