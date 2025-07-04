import FinishSound from 'assets/finish.mp3';
import clsx from 'clsx';
import { supabase } from 'lib/supabase';
import { useEffect, useRef, useState } from 'react';
import { Popover } from 'react-tiny-popover';
import { useRoomId, useRoomMode } from 'stores/useRoomStore';
import { useTimerActions } from 'stores/useRoomTimersStore';
import { RoomAccess } from 'types/RoomTypes';
import { Database } from 'types/supabase';
import { formatTime, formatTimestampToTime } from 'utils/timeUtils';
import './Timer.css';

type TimerData = Database['public']['Tables']['timers']['Row'];

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
  const roomId = useRoomId();
  const { updateTimer, fetchTimers } = useTimerActions();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localEventName, setLocalEventName] = useState(event_name);
  const [eventFinishTime, setEventFinishTime] = useState<number>(
    Date.now() + (rounds - current_round_number) * round_time + Math.max(0, time_remaining),
  );
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(
    is_running ? new Date(end_time).getTime() - Date.now() : time_remaining,
  );

  useEffect(() => {
    const onTimerTick = () => {
      const now = Date.now();
      const remaining = is_running ? new Date(end_time).getTime() - now : time_remaining;
      const estimatedFinishTime = now + (rounds - current_round_number) * round_time + Math.max(0, remaining);

      setRoundTimeRemaining(remaining);
      setEventFinishTime(estimatedFinishTime);
    };

    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  }, [is_running, end_time, time_remaining, roundTimeRemaining, rounds, current_round_number, round_time]);

  const [soundPlayed, setSoundPlayed] = useState<boolean>(time_remaining > 0 ? false : true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (time_remaining <= 0 && !soundPlayed) {
      setSoundPlayed(true);
      audioRef.current?.play();
    }

    // Reset the sound played if we go back above 0s remaining
    if (time_remaining > 0 && soundPlayed) {
      setSoundPlayed(false);
    }
  }, [time_remaining, audioRef, soundPlayed]);

  const handleEventNameUpdate = async (e: React.FocusEvent<HTMLInputElement, Element>) => {
    const newName = e.target.value;
    if (newName === '') {
      setLocalEventName(event_name);
      return;
    } else {
      // Optimistic Update
      updateTimer(id, {
        event_name: newName,
      });

      const { error } = await supabase.rpc('change_event_name', { _timer_id: id, _name: newName });

      if (error) {
        console.error(error.message);
        fetchTimers(roomId);
      }
    }
  };

  const handleStartTimer = async () => {
    const startDate = new Date();

    // optimistic start
    const optimisticEndTime = new Date(startDate.getTime() + time_remaining).toISOString();

    updateTimer(id, {
      end_time: optimisticEndTime,
      is_running: true,
    });

    const { error } = await supabase.rpc('start_timer', { _timer_id: id, _start_time: startDate.toISOString() });

    if (error) {
      console.error('Failed to start timer:', error.message);
      fetchTimers(roomId);
    }
  };

  const handlePauseTimer = async () => {
    const pauseDate = new Date();

    // optimistic pause
    const optimisticTimeRemaining = new Date(end_time).getTime() - pauseDate.getTime();

    updateTimer(id, {
      time_remaining: optimisticTimeRemaining,
      is_running: false,
    });

    const { error } = await supabase.rpc('pause_timer', { _timer_id: id, _pause_time: pauseDate.toISOString() });

    if (error) {
      console.error('Failed to pause timer:', error.message);
      fetchTimers(roomId);
    }
  };

  const handleDeleteTimer = async () => {
    const { error } = await supabase.rpc('delete_timer', {
      _timer_id: id,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  const handleNextRound = async () => {
    // Optimistic Update
    updateTimer(id, {
      current_round_number: current_round_number + 1,
      time_remaining: round_time,
      is_running: false,
    });

    const { error } = await supabase.rpc('next_round', {
      _timer_id: id,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  const handleAdjustEndTime = async (adjustment: number) => {
    // Optimistic Update
    const endTimeConverted = new Date(end_time).getTime();
    updateTimer(id, {
      end_time: new Date(endTimeConverted + adjustment).toISOString(),
    });

    const { error } = await supabase.rpc('update_end_time', {
      _timer_id: id,
      _time_modifier: adjustment,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  const handleRemoveRound = async () => {
    // Optimistic Update
    const min = has_draft ? 0 : 1;
    updateTimer(id, {
      rounds: Math.max(min, rounds - 1),
    });

    const { error } = await supabase.rpc('remove_round', {
      _timer_id: id,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  const handleAddRound = async () => {
    // Optimistic Update
    updateTimer(id, {
      rounds: rounds + 1,
    });

    const { error } = await supabase.rpc('add_round', {
      _timer_id: id,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  const handlePreviousRound = async () => {
    // Optimistic Update
    const new_round = current_round_number - 1;
    const time = has_draft && new_round === 0 ? draft_time! : round_time;

    const { error } = await supabase.rpc('previous_round', {
      _timer_id: id,
    });

    updateTimer(id, {
      current_round_number: current_round_number - 1,
      time_remaining: time,
      is_running: false,
    });

    if (error) {
      console.error(error.message);
      fetchTimers(roomId);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={FinishSound} />
      <div
        className={clsx('timer-container', {
          overtime: time_remaining < 0,
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
