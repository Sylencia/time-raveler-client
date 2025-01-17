import { useWebSocketContext } from 'components/WebSocketContext';
import { FormEvent, useCallback, useEffect, useState } from 'react';
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
  const [updateEditRoomInfo, updateViewRoomInfo, getRoomCode, resetRoomStore] = useRoomStore(
    useShallow((state) => [
      state.updateEditRoomInfo,
      state.updateViewOnlyRoomInfo,
      state.getRoomCode,
      state.resetRoomStore,
    ]),
  );
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { lastJsonMessage, sendJsonMessage } = useWebSocketContext();

  const handleRoomInfo = useCallback(
    (data: RoomInfoMessage) => {
      if (data.accessLevel === RoomAccess.EDIT) {
        const { editAccessId, viewAccessId, accessLevel } = data as EditRoomInfoMessage;
        updateEditRoomInfo(editAccessId, viewAccessId, accessLevel);
      } else if (data.accessLevel === RoomAccess.VIEW_ONLY) {
        const { viewAccessId, accessLevel } = data as ViewOnlyRoomInfoMessage;
        updateViewRoomInfo(viewAccessId, accessLevel);
      }

      setRoomCodeInput('');
    },
    [updateEditRoomInfo, updateViewRoomInfo],
  );

  const handleRoomCheck = useCallback(
    (data: RoomValidityMessage) => {
      if (data.valid) {
        setRoomCodeInput(getRoomCode());
      } else {
        resetRoomStore();
      }
    },
    [setRoomCodeInput, getRoomCode, resetRoomStore],
  );

  useEffect(() => {
    if (!lastJsonMessage) {
      return;
    }

    switch (lastJsonMessage.type) {
      case 'roomInfo':
        handleRoomInfo(lastJsonMessage);
        break;
      case 'roomValidity':
        handleRoomCheck(lastJsonMessage);
        break;
      case 'error':
        setErrorMessage(lastJsonMessage.message);
        break;
      default:
        return;
    }
  }, [lastJsonMessage, handleRoomInfo, handleRoomCheck]);

  const handleCreateNewRoom = () => {
    sendJsonMessage({ type: 'createRoom' });
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendJsonMessage({ type: 'subscribe', accessId: roomCodeInput.toUpperCase() });
  };

  return (
    <div className="welcome">
      <h1 className="welcome-heading">Create and sync timers for multiple events at your local game store.</h1>

      <div className="welcome-room-select">
        <button onClick={handleCreateNewRoom}>Create New Room</button>
        <p>OR</p>
        <div>
          <form className="welcome-join-form" onSubmit={handleJoinRoom}>
            <input
              className="room-input"
              id="roomCode"
              type="text"
              required
              value={roomCodeInput}
              placeholder="Code"
              pattern="[a-zA-Z0-9]{4}"
              size={6}
              minLength={4}
              maxLength={4}
              title="Room codes are 4 characters long"
              onChange={(event) => {
                setRoomCodeInput(event.target.value);
                setErrorMessage('');
              }}
            ></input>
            <button type="submit">Join Room</button>
          </form>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );
};
