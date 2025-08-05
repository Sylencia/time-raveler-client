import { useIsRestoring } from '@tanstack/react-query';
import { Header } from 'components/Header';
import { Room } from 'components/Room';
import { Welcome } from 'components/Welcome';
import { useCheckRoom } from 'hooks/queries/useCheckRoom';
import { useRoomInfo } from 'hooks/queries/useRoomInfo';
import { useCleanupRoom } from 'hooks/useCleanupRoom';
import { useUpdateTick } from 'hooks/useUpdateTick';
import { useEffect } from 'react';
import './App.css';

function App() {
  const { roomInfo } = useRoomInfo();
  const isRestoring = useIsRestoring();
  const { cleanupRoom } = useCleanupRoom();
  const { data: roomExists, isLoading } = useCheckRoom();
  useUpdateTick();

  useEffect(() => {
    if (roomExists === false) {
      cleanupRoom();
    }
  }, [roomExists, cleanupRoom]);

  const getContent = () => {
    if (isLoading || isRestoring) {
      return <div className="loading-msg">Loading app...</div>;
    }

    if (roomInfo?.access_level) {
      return <Room />;
    }

    return <Welcome />;
  };

  return (
    <div className="app">
      <div className="app-header">
        <Header />
      </div>
      <div className="app-content">{getContent()}</div>
    </div>
  );
}

export default App;
