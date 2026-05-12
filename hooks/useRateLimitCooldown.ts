'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseRateLimitCooldownReturn {
  isRateLimited: boolean;
  secondsRemaining: number;
  rateLimitMessage: string | null;
  triggerCooldown: (seconds: number) => void;
  clearCooldown: () => void;
}

export function useRateLimitCooldown(): UseRateLimitCooldownReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsRemaining(0);
  }, []);

  const triggerCooldown = useCallback(
    (seconds: number) => {
      clearCooldown();
      setSecondsRemaining(seconds);
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearCooldown],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isRateLimited = secondsRemaining > 0;
  const rateLimitMessage = isRateLimited
    ? `Too many requests. Try again in ${secondsRemaining}s.`
    : null;

  return {
    isRateLimited,
    secondsRemaining,
    rateLimitMessage,
    triggerCooldown,
    clearCooldown,
  };
}
