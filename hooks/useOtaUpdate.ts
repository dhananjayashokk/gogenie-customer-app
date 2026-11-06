import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';

const RECHECK_EVERY_MS = 30 * 60 * 1000; // also re-check when the app comes back to the foreground, at most every 30 min

/**
 * Over-the-air updates (EAS Update): checks for a newer JS bundle on launch and on returning to the app,
 * downloads it, and offers to restart into it. Does nothing in development / Expo Go.
 */
export function useOtaUpdate() {
  const lastCheck = useRef(0);
  const prompted = useRef(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const check = async () => {
      if (prompted.current || Date.now() - lastCheck.current < RECHECK_EVERY_MS) return;
      lastCheck.current = Date.now();
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;
        await Updates.fetchUpdateAsync();
        prompted.current = true;
        Alert.alert('Update ready', 'A new version of the app has been downloaded. Restart now to use it?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart', onPress: () => Updates.reloadAsync() },
        ]);
      } catch {
        // offline or update server unreachable: try again next time
      }
    };

    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, []);
}
