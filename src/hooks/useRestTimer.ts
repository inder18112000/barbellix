/**
 * useRestTimer — SRP: owns only the rest timer countdown.
 * ISP: screens import this separately from useActiveWorkout.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRestTimerReturn {
  secondsLeft: number;
  isRunning: boolean;
  start: (durationSecs: number) => void;
  stop: () => void;
  reset: () => void;
}

export function useRestTimer(): UseRestTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const start = useCallback((durationSecs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(durationSecs);
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSecondsLeft(0);
  }, [stop]);

  return { secondsLeft, isRunning, start, stop, reset };
}
