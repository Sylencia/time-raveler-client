import { useEffect } from 'react';

export const useUpdateTick = (delay: number) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const event = new Event('timerTick');
      window.dispatchEvent(event);
    }, delay);

    return () => clearInterval(interval);
  }, [delay]);
};
