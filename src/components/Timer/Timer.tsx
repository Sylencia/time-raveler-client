import FinishSound from 'assets/finish.mp3';
import clsx from 'clsx';
import { useEventTimeCalculator } from 'hooks/useEventTimeCalculator';
import { supabase } from 'lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { useRoomMode } from 'stores/useRoomStore';
import { type TimerData, useTimerActions } from 'stores/useRoomTimersStore';
import { RoomAccess } from 'types/RoomTypes';
import { handleOptimisticUpdate } from 'utils/handleOptimisticUpdate';
import { formatTime, formatTimestampToTime } from 'utils/timeUtils';
import './Timer.css';

interface TimerProps {
  timerData: TimerData;
}

export const Timer = ({ timerData }: TimerProps) => {
  const {
    id,
    end_time,
    time_remaining,
    is_running,
    event_name,
    rounds,
    current_round_number,
    has_draft,
    draft_time,
    round_time,
  } = timerData;
  const mode = useRoomMode();
  const { addTimer, updateTimer, deleteTimer } = useTimerActions();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localEventName, setLocalEventName] = useState(event_name);

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

  const handleEventNameUpdate = async (e: React.FocusEvent<HTMLInputElement, Element>) => {
    const newName = e.target.value;
    if (newName === '') {
      setLocalEventName(event_name);
      return;
    }
    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          event_name: newName,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          event_name: event_name,
        });

        setLocalEventName(event_name);
      },
      mutation: async () => {
        const { error } = await supabase.rpc('change_event_name', {
          _timer_id: id,
          _name: newName,
        });
        return { error };
      },
    });
  };

  const handleStartTimer = async () => {
    const startDate = new Date();

    const optimisticEndTime = new Date(startDate.getTime() + time_remaining).toISOString();

    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          end_time: optimisticEndTime,
          is_running: true,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          end_time,
          is_running,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('start_timer', { _timer_id: id, _start_time: startDate.toISOString() });
        return { error };
      },
    });
  };

  const handlePauseTimer = async () => {
    const pauseDate = new Date();
    const optimisticTimeRemaining = new Date(end_time).getTime() - pauseDate.getTime();

    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          time_remaining: optimisticTimeRemaining,
          is_running: false,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          end_time,
          is_running,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('pause_timer', { _timer_id: id, _pause_time: pauseDate.toISOString() });
        return { error };
      },
    });
  };

  const handleDeleteTimer = async () => {
    await handleOptimisticUpdate({
      optimisticAction: () => deleteTimer(id),
      rollbackAction: () => {
        addTimer(timerData);
      },
      mutation: async () => {
        const { error } = await supabase.rpc('delete_timer', {
          _timer_id: id,
        });
        return { error };
      },
    });
  };

  const handleNextRound = async () => {
    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          current_round_number: current_round_number + 1,
          time_remaining: round_time,
          is_running: false,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          current_round_number,
          time_remaining,
          is_running,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('next_round', {
          _timer_id: id,
        });
        return { error };
      },
    });
  };

  const handleAdjustEndTime = async (adjustment: number) => {
    const endTimeConverted = new Date(end_time).getTime();

    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          end_time: new Date(endTimeConverted + adjustment).toISOString(),
          time_remaining: time_remaining + adjustment,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          end_time,
          time_remaining,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('update_end_time', {
          _timer_id: id,
          _time_modifier: adjustment,
        });
        return { error };
      },
    });
  };

  const handleRemoveRound = async () => {
    const min = has_draft ? 0 : 1;

    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          rounds: Math.max(min, rounds - 1),
        }),
      rollbackAction: () => {
        updateTimer(id, {
          rounds,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('remove_round', {
          _timer_id: id,
        });
        return { error };
      },
    });
  };

  const handleAddRound = async () => {
    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          rounds: rounds + 1,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          rounds,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('add_round', {
          _timer_id: id,
        });
        return { error };
      },
    });
  };

  const handlePreviousRound = async () => {
    const new_round = current_round_number - 1;
    const time = has_draft && new_round === 0 ? draft_time! : round_time;

    await handleOptimisticUpdate({
      optimisticAction: () =>
        updateTimer(id, {
          current_round_number: new_round,
          time_remaining: time,
          is_running: false,
        }),
      rollbackAction: () => {
        updateTimer(id, {
          current_round_number,
          time_remaining,
          is_running,
        });
      },
      mutation: async () => {
        const { error } = await supabase.rpc('previous_round', {
          _timer_id: id,
        });
        return { error };
      },
    });
  };

  return (
    <>
      <audio ref={audioRef} src={FinishSound} />
      <div
        className={clsx('timer-container', {
          overtime: roundTimeRemaining < 0,
          'view-mode': mode === RoomAccess.VIEW_ONLY,
        })}
      >
        <h2 className="timer-details-name">{event_name}</h2>
        <p className="timer-details-round">
          {current_round_number === 0 ? 'Draft Time' : `Round ${current_round_number}/${rounds}`}
        </p>

        {mode === RoomAccess.EDIT && (
          <div className="timer-button-container">
            <button
              className={clsx({
                'pause-button': is_running,
                'start-button': !is_running,
              })}
              onClick={() => (is_running ? handlePauseTimer() : handleStartTimer())}
            >
              {is_running ? 'Pause' : 'Start'}
            </button>

            {current_round_number === rounds ? (
              <button onClick={handleDeleteTimer} className="end-button">
                End Event
              </button>
            ) : (
              <button onClick={handleNextRound} className="next-round-button">
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
                    <button onClick={() => handleAdjustEndTime(-5 * 60 * 1000)}>-5m</button>
                    <button onClick={() => handleAdjustEndTime(-1 * 60 * 1000)}>-1m</button>
                    <button onClick={() => handleAdjustEndTime(1 * 60 * 1000)}>+1m</button>
                    <button onClick={() => handleAdjustEndTime(5 * 60 * 1000)}>+5m</button>
                  </div>

                  <div className="timer-controls-grid-2">
                    <button disabled={rounds <= 1 || current_round_number === rounds} onClick={handleRemoveRound}>
                      -1 Round
                    </button>
                    <button onClick={handleAddRound}>+1 Round</button>
                  </div>

                  <div className="timer-controls-grid-2">
                    <button
                      disabled={has_draft ? current_round_number <= 0 : current_round_number <= 1}
                      onClick={handlePreviousRound}
                    >
                      Prev Round
                    </button>
                    <button disabled={current_round_number === rounds} onClick={handleNextRound}>
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
