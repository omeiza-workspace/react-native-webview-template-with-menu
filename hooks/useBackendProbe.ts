import { useState, useCallback, useEffect } from 'react';
import { useBackoffRetry } from './useBackoffRetry';
import { persistLastGoodUrl } from './useLastGoodUrl';
import { setLastError } from '@/utils/errorStore';
import { APP_CONFIG } from '@/config/app';

export function useBackendProbe(isOnline: boolean | null) {
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [retrying, setRetrying] = useState(false);

  const probe = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(APP_CONFIG.APP_URL, { method: 'GET', signal: controller.signal });
      setServerOk(true);
      await persistLastGoodUrl(APP_CONFIG.APP_URL);
      reset();
    } catch (err) {
      setLastError(err);
      setServerOk(false);
      throw err;
    } finally {
      clearTimeout(timeout);
      setRetrying(false);
    }
  }, []);

  const { retry, reset } = useBackoffRetry(probe);

  // ← MOVE this logic inside useEffect
  useEffect(() => {
    if (isOnline === true && serverOk !== true && !retrying) {
      setRetrying(true);
      probe().catch(retry);
    }
  }, [isOnline, serverOk, retrying]);

  return { serverOk, retrying, retry };
}
