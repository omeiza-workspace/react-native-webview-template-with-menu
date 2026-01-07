import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_GOOD_URL = 'last_good_url';

export function useLastGoodUrl(isOnline: boolean | null) {
  const [offlineUrl, setOfflineUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOnline === false) {
      AsyncStorage.getItem(LAST_GOOD_URL).then(setOfflineUrl);
    }
  }, [isOnline]);

  return offlineUrl;
}

export async function persistLastGoodUrl(url: string) {
  await AsyncStorage.setItem(LAST_GOOD_URL, url);
}

export async function clearLastGoodUrl() {
  await AsyncStorage.removeItem(LAST_GOOD_URL);
}