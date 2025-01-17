import { ExitIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { ExpandablePill } from 'components/ExpandablePill';
import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useRoomStore } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import logo from '../../assets/logo.svg';
import './Header.css';

const getCurrentTimeString = (): string => {
  const now = new Date();

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes}${ampm}`;
  return timeString;
};

export const Header = () => {
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());
  const [connectToWS, setConnectToWS] = useState<boolean>(true);

  const { readyState, sendJsonMessage } = useWebSocket(
    import.meta.env.VITE_WS_URL!,
    {
      share: true,
      shouldReconnect: () => true,
      reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      onMessage: (message) => {
        const messageData: string = message.data;

        try {
          const data = JSON.parse(messageData);

          if (data.type === 'unsubscribeSuccess') {
            resetRoomStore();
          }

          switch (data.type) {
            case 'roomInfo':
              break;
            case 'roomUpdate':
              break;
            case 'unsubscribeSuccess':
              resetRoomStore();
              break;
            case 'roomValidity':
              break;
            default:
              console.warn('Unknown message type', data);
          }
        } catch (e) {
          console.error('Error parsing message', e);
        }
      },
    },
    connectToWS,
  );

  const { editRoomId, viewOnlyRoomId, mode, getRoomCode, resetRoomStore } = useRoomStore();

  useEffect(() => {
    window.addEventListener('timerTick', onTimerTick);

    return () => window.removeEventListener('timerTick', onTimerTick);
  });

  const onTimerTick = (): void => {
    setCurrentTime(getCurrentTimeString());
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

  const handleAttemptReconnect = () => {
    if (readyState !== ReadyState.OPEN) {
      setConnectToWS(false);
      setTimeout(() => {
        setConnectToWS(true);
      }, 100);
    }
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
        <div className="header-connection-status" onClick={handleAttemptReconnect}>
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
