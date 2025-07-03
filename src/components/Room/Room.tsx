import { AddTimer } from 'components/AddTimer';
import { Timer } from 'components/Timer';
import { useRoomTimersRealtime } from 'hooks/useRoomTimersRealtime';
import { useRoomMode } from 'stores/useRoomStore';
import { useLoadingTimers, useTimers } from 'stores/useRoomTimersStore';
import { RoomAccess } from 'types/RoomTypes';
import './Room.css';

export const Room = () => {
  const timers = useTimers();
  const loading = useLoadingTimers();
  const mode = useRoomMode();

  useRoomTimersRealtime();

  if (loading) {
    return <div className="no-timers-msg">Loading timers...</div>;
  }

  return (
    <>
      {timers.length === 0 ? (
        <div className="no-timers-msg">No timers added yet.</div>
      ) : (
        <div className="timer-stack">
          {timers.map((timer) => (
            <Timer key={timer.id} timerData={timer} />
          ))}
        </div>
      )}

      {mode === RoomAccess.EDIT && <AddTimer />}
    </>
  );
};
