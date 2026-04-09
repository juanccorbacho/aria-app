import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { TamaguiProvider, Theme } from 'tamagui';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import config from '../tamagui.config';

// Prevent auto hide until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  
  const [loaded] = useFonts({
    FigmaSans: require('../assets/fonts/FigmaSans-Regular.ttf'),
    FigmaMono: require('../assets/fonts/FigmaMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || isLoading) return null;

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {!user && <Redirect href="/(auth)/login" />}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(app)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}
