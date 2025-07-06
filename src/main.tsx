import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 1500,
      }}
    />
    <App />
  </StrictMode>,
);
