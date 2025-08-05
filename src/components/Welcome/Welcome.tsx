import { useCreateRoom } from 'hooks/mutations/useCreateRoom';
import { useJoinRoom } from 'hooks/mutations/useJoinRoom';
import { FormEvent, useState } from 'react';
import './Welcome.css';

export const Welcome = () => {
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const { mutate: joinRoom } = useJoinRoom();
  const { mutate: createRoom } = useCreateRoom();

  const handleCreateNewRoom = async () => {
    createRoom();
  };

  const handleJoinRoom = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    joinRoom({ roomCode: roomCodeInput });
  };

  return (
    <div className="welcome">
      <h1 className="welcome-heading">Create and sync timers for multiple events at your local game store.</h1>

      <div className="welcome-notice">
        2025-08-05: An update may have broken the timers but this should be fixed now (hopefully!)
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
