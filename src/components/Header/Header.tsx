import { ExitIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons';
import logo from 'assets/logo.svg';
import { ExpandablePill } from 'components/ExpandablePill';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { useCleanupRoom } from 'hooks/useCleanupRoom';
import { useEffect, useState } from 'react';
import { RoomAccess } from 'types/roomTypes';
import { formatTimestampToTime } from 'utils/timeUtils';
import './Header.css';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState<string>(formatTimestampToTime(Date.now()));

  const { data: roomInfo } = useRoomInfo();
  const { cleanupRoom } = useCleanupRoom();

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  }, []);

  const onTimerTick = (): void => {
    setCurrentTime(formatTimestampToTime(Date.now()));
  };

  const handleLeaveRoom = () => {
    cleanupRoom();
  };

  return (
    <header className={'header'}>
      <div className="header-container">
        <div className="header-left">
          <img src={logo} alt="Logo" />
          {roomInfo && (
            <div className="header-room-info">
              {roomInfo.access_level === RoomAccess.EDIT && (
                <ExpandablePill icon={<Pencil1Icon />} text={roomInfo.edit_code} className="edit-pill" />
              )}
              <ExpandablePill icon={<EyeOpenIcon />} text={roomInfo.read_code} className="view-pill" />
              <ExpandablePill icon={<ExitIcon />} text="Leave Room" onClick={handleLeaveRoom} className="leave-pill" />
            </div>
          )}
        </div>
        <span className="current-time">{currentTime}</span>
      </div>
    </header>
  );
};
