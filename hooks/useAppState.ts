import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useAppState() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appState.current = state;
    });
    return () => sub.remove();
  }, []);

  return appState;
}
