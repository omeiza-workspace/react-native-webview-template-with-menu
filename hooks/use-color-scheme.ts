import { useColorScheme as RNUseColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const scheme = RNUseColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
