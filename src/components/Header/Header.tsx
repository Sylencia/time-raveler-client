import { ExitIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons';
import logo from 'assets/logo.svg';
import { ExpandablePill } from 'components/ExpandablePill';
import { useEffect, useState } from 'react';
import { useEditRoomId, useRoomActions, useRoomMode, useViewRoomId } from 'stores/useRoomStore';
import { useTimerActions } from 'stores/useRoomTimersStore';
import { RoomAccess } from 'types/RoomTypes';
import { formatTimestampToTime } from 'utils/timeUtils';
import './Header.css';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState<string>(formatTimestampToTime(Date.now()));

  const editRoomId = useEditRoomId();
  const viewOnlyRoomId = useViewRoomId();
  const mode = useRoomMode();
  const { clearRoom } = useRoomActions();
  const { clearTimers } = useTimerActions();

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  }, []);

  const onTimerTick = (): void => {
    setCurrentTime(formatTimestampToTime(Date.now()));
  };

  const handleLeaveRoom = () => {
    clearRoom();
    clearTimers();
  };

  return (
    <header className={'header'}>
      <div className="header-container">
        <div className="header-left">
          <img src={logo} alt="Logo" />
          {mode !== RoomAccess.NONE && (
            <div className="header-room-info">
              {mode === RoomAccess.EDIT && (
                <ExpandablePill icon={<Pencil1Icon />} text={editRoomId} className="edit-pill" />
              )}
              <ExpandablePill icon={<EyeOpenIcon />} text={viewOnlyRoomId} className="view-pill" />
              <ExpandablePill icon={<ExitIcon />} text="Leave Room" onClick={handleLeaveRoom} className="leave-pill" />
            </div>
          )}
        </div>
        <span className="current-time">{currentTime}</span>
      </div>
    </header>
  );
};
