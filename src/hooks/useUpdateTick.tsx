import { useEffect, useRef } from 'react';

export const useUpdateTick = (interval: number = 1000) => {
  const expected = useRef(Date.now() + interval);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tick = () => {
      const drift = Date.now() - expected.current;
      const event = new Event('timerTick');
      window.dispatchEvent(event);

      // Schedule next tick, adjusting for drift
      expected.current += interval;
      timeoutRef.current = setTimeout(tick, Math.max(0, interval - drift));
    };

    expected.current = Date.now() + interval;
    timeoutRef.current = setTimeout(tick, interval);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Force immediate update when tab becomes active
        expected.current = Date.now() + interval;
        const event = new Event('timerTick');
        window.dispatchEvent(event);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(tick, interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
};
