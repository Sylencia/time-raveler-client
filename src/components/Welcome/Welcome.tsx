import { FormEvent, useEffect, useRef, useState } from 'react';
import useWebSocket from 'react-use-websocket';
import { useRoomStore } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import {
  EditRoomInfoMessage,
  RoomValidityMessage,
  ViewOnlyRoomInfoMessage,
  type RoomInfoMessage,
} from 'types/ServerMessageTypes';
import { useShallow } from 'zustand/shallow';
import './Welcome.css';

export const Welcome = () => {
  const didUnmount = useRef(false);
  const [updateEditRoomInfo, updateViewRoomInfo, getRoomCode, resetRoomStore] = useRoomStore(
    useShallow((state) => [
      state.updateEditRoomInfo,
      state.updateViewOnlyRoomInfo,
      state.getRoomCode,
      state.resetRoomStore,
    ]),
  );
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');

  const { sendJsonMessage } = useWebSocket(import.meta.env.VITE_WS_URL!, {
    share: true,
    shouldReconnect: () => didUnmount.current === false,
    reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
    onOpen: () => {
      const roomCode = getRoomCode();
      if (roomCode) {
        sendJsonMessage({
          type: 'roomCheck',
          accessId: roomCode,
        });
      }
    },
    onMessage: (message) => {
      const messageData: string = message.data;

      try {
        const data = JSON.parse(messageData);

        if (data.type === 'roomInfo') {
          handleRoomInfo(data);
        }

        if (data.type === 'roomValidity') {
          handleRoomCheck(data);
        }
      } catch (e) {
        console.error('Error parsing message', e);
      }
    },
  });

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  const handleRoomInfo = (data: RoomInfoMessage) => {
    if (data.accessLevel === RoomAccess.EDIT) {
      const { editAccessId, viewAccessId, accessLevel } = data as EditRoomInfoMessage;
      updateEditRoomInfo(editAccessId, viewAccessId, accessLevel);
    } else if (data.accessLevel === RoomAccess.VIEW_ONLY) {
      const { viewAccessId, accessLevel } = data as ViewOnlyRoomInfoMessage;
      updateViewRoomInfo(viewAccessId, accessLevel);
    }
  };

  const handleRoomCheck = (data: RoomValidityMessage) => {
    if (data.valid) {
      setRoomCodeInput(getRoomCode());
    } else {
      resetRoomStore();
    }
  };

  const handleCreateNewRoom = () => {
    sendJsonMessage({ type: 'createRoom' });
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendJsonMessage({ type: 'subscribe', accessId: roomCodeInput.toUpperCase() });
    setRoomCodeInput('');
  };

  return (
    <div className="welcome">
      <h1 className="welcome-heading">Create and sync timers for multiple events at your local game store.</h1>

      <div className="welcome-room-select">
        <button onClick={handleCreateNewRoom}>Create New Room</button>
        <p>OR</p>
        <form className="welcome-join-form" onSubmit={handleJoinRoom}>
          <input
            className="room-input"
            id="roomCode"
            type="text"
            required
            value={roomCodeInput}
            placeholder="Code"
            pattern="[a-zA-Z0-9]{4}"
            size={4}
            minLength={4}
            maxLength={4}
            title="Room codes are 4 letters long"
            onChange={(event) => {
              setRoomCodeInput(event.target.value);
            }}
          ></input>
          <button type="submit">Join Room</button>
        </form>
      </div>
    </div>
  );
};
