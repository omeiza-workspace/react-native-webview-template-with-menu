import * as LocalAuthentication from 'expo-local-authentication';

// const auth = await LocalAuthentication.authenticateAsync();

// if (auth.success) {
//   webViewRef.current?.injectJavaScript(`
//     window.GEFIX.postMessage({ type: 'BIOMETRIC_OK' });
//     true;
//   `);
// }

export async function biometricAuth() {
  return (await LocalAuthentication.authenticateAsync()).success;
}
