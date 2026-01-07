import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const updateState = (state: NetInfoState) => {
      setIsOnline(
        state.isConnected === true &&
        state.isInternetReachable !== false
      );
    };

    // Get initial state immediately
    NetInfo.fetch().then(updateState);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(updateState);

    return () => unsubscribe();
  }, []);

  return isOnline;
}
