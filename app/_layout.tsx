import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider, useAppColorScheme } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { useOtaUpdate } from '@/hooks/useOtaUpdate';

function AuthenticatedApp() {
  const colorScheme = useAppColorScheme();
  const { state } = useAuth();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Show loading while fonts are loading or auth is being restored
  if (!loaded || state.isLoading) {
    return <Loading message="Loading..." />;
  }

  // One navigator with two protected groups. When the auth state flips (sign in / sign out), expo-router
  // moves to the first screen of the group that is now allowed: login when signed out, the tabs when signed in.
  const signedIn = state.isAuthenticated;

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
          <Stack.Screen name="auth/onboarding" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  useOtaUpdate();
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <AuthenticatedApp />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
