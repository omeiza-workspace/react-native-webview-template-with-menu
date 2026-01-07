import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

export const fallbackStyles = (scheme: 'light' | 'dark' = 'light') =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: Colors[scheme].surface,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      fontFamily: Fonts.sans,
      marginBottom: 8,
      textAlign: 'center',
      color: Colors[scheme].textPrimary,
    },
    message: {
      fontSize: 15,
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 22,
      color: Colors[scheme].textSecondary,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 8,
      backgroundColor: Colors[scheme].primary,
      marginTop: 16,
    },
    buttonText: {
      color: Colors[scheme].textPrimary,
      fontWeight: '600',
      fontSize: 16,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: scheme === 'dark' ? '#ffffff' : '#000000',
    },

    retryText: {
      color: scheme === 'dark' ? '#000000' : '#ffffff',
      fontWeight: '600',
    },

  });
