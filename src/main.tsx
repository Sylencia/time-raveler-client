import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 12,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 6, // Delete after 6 hours of inactivity
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'joined-room',
        },
      }}
    >
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 1500,
        }}
      />
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
