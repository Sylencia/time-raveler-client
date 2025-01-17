import { ExitIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons';
import logo from 'assets/logo.svg';
import clsx from 'clsx';
import { ExpandablePill } from 'components/ExpandablePill';
import { useWebSocketContext } from 'components/WebSocketContext';
import { useEffect, useState } from 'react';
import { ReadyState } from 'react-use-websocket';
import { useRoomStore } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import { formatTimestampToTime } from 'utils/timeUtils';
import './Header.css';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState<string>(formatTimestampToTime(Date.now()));

  const { readyState, sendJsonMessage, lastJsonMessage, reconnect } = useWebSocketContext();
  const { editRoomId, viewOnlyRoomId, mode, getRoomCode, resetRoomStore } = useRoomStore();

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  });

  useEffect(() => {
    if (!lastJsonMessage) {
      return;
    }

    switch (lastJsonMessage.type) {
      case 'unsubscribeSuccess':
        resetRoomStore();
        break;
      default:
        return;
    }
  }, [lastJsonMessage, resetRoomStore]);

  const onTimerTick = (): void => {
    setCurrentTime(formatTimestampToTime(Date.now()));
  };

  const readyStateText = {
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'The server connection is closing...',
    [ReadyState.CLOSED]: 'Disconnected from the server. Reconnecting...',
  }[readyState];

  const handleLeaveRoom = () => {
    sendJsonMessage({
      type: 'unsubscribe',
      accessId: getRoomCode(),
    });
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
        <div className="header-connection-status" onClick={reconnect}>
          <div
            className={clsx('header-status-icon', {
              'header-status-connecting': readyState === ReadyState.CONNECTING,
              'header-status-open': readyState === ReadyState.OPEN,
              'header-status-closed': readyState === ReadyState.CLOSED || readyState === ReadyState.CLOSING,
            })}
            title={readyStateText}
          ></div>
          <span className="current-time">{currentTime}</span>
        </div>
      </div>
    </header>
  );
};
