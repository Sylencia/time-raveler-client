import { Header } from 'components/Header';
import { Room } from 'components/Room';
import { Welcome } from 'components/Welcome';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { useUpdateTick } from 'hooks/useUpdateTick';
import './App.css';

function App() {
  const { data: roomInfo } = useRoomInfo();
  useUpdateTick();

  return (
    <div className="app">
      <div className="app-header">
        <Header />
      </div>
      <div className="app-content">{!roomInfo?.access_level ? <Welcome /> : <Room />}</div>
    </div>
  );
}

export default App;
