import { useCallback, useRef } from 'react';

export function useBackoffRetry(
  action: () => Promise<void>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
  }
) {
  const retries = useRef(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const {
    maxRetries = 5,
    baseDelayMs = 1000,
  } = options || {};

  const retry = useCallback(() => {
    if (retries.current >= maxRetries) {
      return;
    }

    const delay = baseDelayMs * Math.pow(2, retries.current);
    retries.current += 1;

    timer.current = setTimeout(() => {
      action().catch(retry);
    }, delay);
  }, [action, baseDelayMs, maxRetries]);

  const reset = () => {
    retries.current = 0;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return { retry, reset };
}
