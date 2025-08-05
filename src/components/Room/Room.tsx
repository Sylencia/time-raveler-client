import { AddTimer } from 'components/AddTimer';
import { Timer } from 'components/Timer';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { useRoomTimers } from 'hooks/queries/useRoomTimers';
import { RoomAccess } from 'types/roomTypes';
import './Room.css';

export const Room = () => {
  const { roomInfo } = useRoomInfo();
  const { timers, isLoading } = useRoomTimers();

  if (isLoading) {
    return <div className="no-timers-msg">Loading timers...</div>;
  }

  return (
    <>
      {!timers || timers?.length === 0 ? (
        <div className="no-timers-msg">No timers added yet.</div>
      ) : (
        <div className="timer-stack">
          {timers.map((timer) => (
            <Timer key={timer.id} timerData={timer} />
          ))}
        </div>
      )}

      {roomInfo?.access_level === RoomAccess.EDIT && <AddTimer />}
    </>
  );
};
