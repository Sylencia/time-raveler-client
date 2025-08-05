import FinishSound from 'assets/finish.mp3';
import clsx from 'clsx';
import { useAddRound } from 'hooks/mutations/useAddRound';
import { useAdjustEndTime } from 'hooks/mutations/useAdjustEndTime';
import { useDeleteTimer } from 'hooks/mutations/useDeleteTimer';
import { useNextRound } from 'hooks/mutations/useNextRound';
import { usePauseTimer } from 'hooks/mutations/usePauseTimer';
import { usePreviousRound } from 'hooks/mutations/usePreviousRound';
import { useRemoveRound } from 'hooks/mutations/useRemoveRound';
import { useStartTimer } from 'hooks/mutations/useStartTimer';
import { useUpdateEventName } from 'hooks/mutations/useUpdateEventName';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { useEventTimeCalculator } from 'hooks/useEventTimeCalculator';
import { useEffect, useRef, useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { type TimerData } from 'types/commonTypes';
import { RoomAccess } from 'types/roomTypes';
import { formatTime, formatTimestampToTime } from 'utils/timeUtils';
import './Timer.css';

interface TimerProps {
  timerData: TimerData;
}

export const Timer = ({ timerData }: TimerProps) => {
  const { id, end_time, time_remaining, is_running, event_name, rounds, current_round_number, has_draft } = timerData;
  const { data: roomInfo } = useRoomInfo();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localEventName, setLocalEventName] = useState(event_name);

  // Mutations
  const { mutate: updateEventName, isPending: namePending } = useUpdateEventName();
  const { mutate: startTimer, isPending: startPending } = useStartTimer();
  const { mutate: pauseTimer, isPending: pausePending } = usePauseTimer();
  const { mutate: deleteTimer } = useDeleteTimer();
  const { mutate: nextRound, isPending: nextRoundPending } = useNextRound();
  const { mutate: adjustEndTime, isPending: adjustTimePending } = useAdjustEndTime();
  const { mutate: removeRound, isPending: removeRoundPending } = useRemoveRound();
  const { mutate: addRound, isPending: addRoundPending } = useAddRound();
  const { mutate: previousRound, isPending: previousRoundPending } = usePreviousRound();

  const { roundTimeRemaining, eventFinishTime } = useEventTimeCalculator(timerData);

  const [soundPlayed, setSoundPlayed] = useState<boolean>(time_remaining > 0 ? false : true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (roundTimeRemaining <= 0 && !soundPlayed) {
      setSoundPlayed(true);
      audioRef.current?.play();
    }

    // Reset the sound played if we go back above 0s remaining
    if (roundTimeRemaining > 0 && soundPlayed) {
      setSoundPlayed(false);
    }
  }, [roundTimeRemaining, audioRef, soundPlayed]);

  const handleEventNameUpdate = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    const newName = e.target.value.trim();

    if (newName === '' || newName === event_name) {
      setLocalEventName(event_name);
      return;
    }

    updateEventName({ timerId: id, newName });
  };

  const handleStartTimer = () => {
    const startDate = new Date();

    const optimisticEndTime = new Date(startDate.getTime() + time_remaining).toISOString();
    startTimer({
      timerId: id,
      startTime: startDate.toISOString(),
      optimisticEndTime,
    });
  };

  const handlePauseTimer = () => {
    const pauseDate = new Date();
    const optimisticTimeRemaining = new Date(end_time).getTime() - pauseDate.getTime();

    pauseTimer({
      timerId: id,
      pauseTime: pauseDate.toISOString(),
      optimisticTimeRemaining,
    });
  };

  const handleDeleteTimer = () => {
    deleteTimer({
      timerId: id,
    });
  };

  const handleNextRound = () => {
    nextRound({
      timerId: id,
    });
  };

  const handleAdjustEndTime = (adjustment: number) => {
    adjustEndTime({
      timerId: id,
      timeAdjustment: adjustment,
    });
  };

  const handleRemoveRound = () => {
    removeRound({
      timerId: id,
    });
  };

  const handleAddRound = async () => {
    addRound({
      timerId: id,
    });
  };

  const handlePreviousRound = async () => {
    previousRound({
      timerId: id,
    });
  };

  return (
    <>
      <audio ref={audioRef} src={FinishSound} />
      <div
        className={clsx('timer-container', {
          overtime: roundTimeRemaining < 0,
          'view-mode': roomInfo?.access_level === RoomAccess.VIEW_ONLY,
        })}
      >
        <h2 className="timer-details-name">{event_name}</h2>
        <p className="timer-details-round">
          {current_round_number === 0 ? 'Draft Time' : `Round ${current_round_number}/${rounds}`}
        </p>

        {roomInfo?.access_level === RoomAccess.EDIT && (
          <div className="timer-button-container">
            <button
              className={clsx({
                'pause-button': is_running,
                'start-button': !is_running,
              })}
              disabled={pausePending || startPending}
              onClick={() => (is_running ? handlePauseTimer() : handleStartTimer())}
            >
              {is_running ? 'Pause' : 'Start'}
            </button>

            {current_round_number === rounds ? (
              <button onClick={handleDeleteTimer} className="end-button">
                End Event
              </button>
            ) : (
              <button
                disabled={nextRoundPending || previousRoundPending}
                onClick={handleNextRound}
                className="next-round-button"
              >
                Next Round
              </button>
            )}

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
                    value={localEventName?.toString()}
                    onChange={(e) => setLocalEventName(e.target.value)}
                    onBlur={handleEventNameUpdate}
                  />

                  <div className="timer-controls-grid-4">
                    <button disabled={adjustTimePending} onClick={() => handleAdjustEndTime(-5 * 60 * 1000)}>
                      -5m
                    </button>
                    <button disabled={adjustTimePending} onClick={() => handleAdjustEndTime(-1 * 60 * 1000)}>
                      -1m
                    </button>
                    <button disabled={adjustTimePending} onClick={() => handleAdjustEndTime(1 * 60 * 1000)}>
                      +1m
                    </button>
                    <button disabled={adjustTimePending} onClick={() => handleAdjustEndTime(5 * 60 * 1000)}>
                      +5m
                    </button>
                  </div>

                  <div className="timer-controls-grid-2">
                    <button
                      disabled={rounds <= 1 || current_round_number === rounds || removeRoundPending || addRoundPending}
                      onClick={handleRemoveRound}
                    >
                      -1 Round
                    </button>
                    <button disabled={removeRoundPending || addRoundPending} onClick={handleAddRound}>
                      +1 Round
                    </button>
                  </div>

                  <div className="timer-controls-grid-2">
                    <button
                      disabled={
                        has_draft
                          ? current_round_number <= 0
                          : current_round_number <= 1 || previousRoundPending || nextRoundPending
                      }
                      onClick={handlePreviousRound}
                    >
                      Prev Round
                    </button>
                    <button
                      disabled={current_round_number === rounds || previousRoundPending || nextRoundPending}
                      onClick={handleNextRound}
                    >
                      Next Round
                    </button>
                  </div>

                  <button onClick={handleDeleteTimer} className="timer-controls-end-event">
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

        <p className="timer-details-time">{formatTime(roundTimeRemaining)}</p>
        <p className="event-finish-time">Finish: {formatTimestampToTime(eventFinishTime)}</p>
      </div>
    </>
  );
};
