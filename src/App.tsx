import { Header } from 'components/Header';
import { Room } from 'components/Room';
import { Welcome } from 'components/Welcome';
import { useUpdateTick } from 'hooks/useUpdateTick';
import { useRoomMode } from 'stores/useRoomStore';
import { RoomAccess } from 'types/RoomTypes';
import './App.css';

function App() {
  const mode = useRoomMode();
  useUpdateTick();

  return (
    <div className="app">
      <div className="app-header">
        <Header />
      </div>
      <div className="app-content">{mode === RoomAccess.NONE ? <Welcome /> : <Room />}</div>
    </div>
  );
}

export default App;
