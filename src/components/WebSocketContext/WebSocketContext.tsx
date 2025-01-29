import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { useRoomStore } from 'stores/useRoomStore';
import { RoomCheckMessage } from 'types/ClientMessageTypes';
import { RoomValidityMessage, ServerMessageTypes } from 'types/ServerMessageTypes';

interface WebSocketContextType {
  lastJsonMessage: ServerMessageTypes;
  sendJsonMessage: SendJsonMessage;
  readyState: ReadyState;
  reconnect: () => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const getRoomCode = useRoomStore((state) => state.getRoomCode);
  const [connectToWS, setConnectToWS] = useState<boolean>(true);
  const [isFirstConnection, setIsFirstConnection] = useState<boolean>(true);

  const { lastJsonMessage, sendJsonMessage, readyState } = useWebSocket<ServerMessageTypes>(
    import.meta.env.VITE_WS_URL!,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      onOpen: () => {
        const roomCode = getRoomCode();

        if (roomCode) {
          sendJsonMessage({
            type: 'roomCheck',
            accessId: roomCode,
          } as RoomCheckMessage);
        }

        if (isFirstConnection) {
          setIsFirstConnection(false);
        } else {
          console.log('hello');
        }
      },
    },
    connectToWS,
  );

  const handleRoomCheck = useCallback(
    (data: RoomValidityMessage) => {
      if (data.valid && !isFirstConnection) {
        sendJsonMessage({ type: 'subscribe', accessId: getRoomCode() });
      }
    },
    [sendJsonMessage, getRoomCode, isFirstConnection],
  );

  useEffect(() => {
    if (!lastJsonMessage) {
      return;
    }

    switch (lastJsonMessage.type) {
      case 'roomValidity':
        handleRoomCheck(lastJsonMessage);
        break;
      default:
        return;
    }
  }, [lastJsonMessage, handleRoomCheck]);

  const reconnect = () => {
    if (readyState !== ReadyState.OPEN) {
      setConnectToWS(false);
      setTimeout(() => {
        setConnectToWS(true);
      }, 100);
    }
  };

  return (
    <WebSocketContext.Provider value={{ lastJsonMessage, sendJsonMessage, readyState, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
