import { supabase } from 'lib/supabase';
import { FormEvent, useState } from 'react';
import { useEditRoomId, useRoomActions, useViewRoomId } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import './Welcome.css';

export const Welcome = () => {
  const { updateRoomId, updateEditRoomId, updateViewRoomId, updateMode } = useRoomActions();
  const editRoomId = useEditRoomId();
  const viewRoomId = useViewRoomId();
  const [roomCodeInput, setRoomCodeInput] = useState<string>(editRoomId || viewRoomId || '');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCreateNewRoom = async () => {
    const { data, error } = await supabase.rpc('create_room');

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const { edit_code, read_code, id } = data[0];
    updateEditRoomId(edit_code);
    updateRoomId(id);
    updateViewRoomId(read_code);
    updateMode(RoomAccess.EDIT);
  };

  const handleJoinRoom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc('join_room', { input_code: roomCodeInput.toUpperCase() });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(`Room code doesn't exist!`);
      return;
    } else {
      const { read_code, access_level, room_id } = data[0];
      const mode = access_level === 'edit' ? RoomAccess.EDIT : RoomAccess.VIEW_ONLY;
      if (access_level === 'edit') {
        updateEditRoomId(roomCodeInput.toUpperCase());
      } else {
        updateEditRoomId('');
      }

      updateRoomId(room_id);
      updateViewRoomId(read_code);
      updateMode(mode);

      setRoomCodeInput('');
    }
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
