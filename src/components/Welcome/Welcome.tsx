import { useJoinRoom } from 'hooks/queries/useJoinRoom';
import { supabase } from 'lib/supabase';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { useEditRoomId, useRoomActions, useViewRoomId } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import './Welcome.css';

export const Welcome = () => {
  const { updateRoomId, updateEditRoomId, updateViewRoomId, updateMode } = useRoomActions();
  const editRoomId = useEditRoomId();
  const viewRoomId = useViewRoomId();
  const [roomCodeInput, setRoomCodeInput] = useState<string>(editRoomId || viewRoomId || '');
  const { mutate: joinRoom } = useJoinRoom();

  const handleCreateNewRoom = async () => {
    const { data, error } = await supabase.rpc('create_room');

    if (error) {
      toast.error(error.message, {
        style: {
          background: 'var(--red)',
          border: 'var(--maroon)',
        },
      });
      return;
    }

    const { edit_code, read_code, room_id } = data[0];
    updateEditRoomId(edit_code);
    updateRoomId(room_id);
    updateViewRoomId(read_code);
    updateMode(RoomAccess.EDIT);
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    joinRoom(
      { roomCode: roomCodeInput },
      {
        onSuccess: () => {
          setRoomCodeInput('');
        },
      },
    );
  };

  return (
    <div className="welcome">
      <h1 className="welcome-heading">Create and sync timers for multiple events at your local game store.</h1>

      <div className="welcome-notice">
        2025-07-06: The backend has been updated to use a new service, please let me know if anything isn't working.
      </div>

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
              }}
            ></input>
            <button type="submit">Join Room</button>
          </form>
        </div>
      </div>
    </div>
  );
};
