import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SairaCondensed_800ExtraBold } from '@expo-google-fonts/saira-condensed';
import { Barlow_400Regular } from '@expo-google-fonts/barlow';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { queryClient } from './src/store/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { usePushRegistration } from './src/hooks/usePushRegistration';
import { colors } from './src/theme';
import { initSentry, Sentry } from './src/lib/sentry';

initSentry();

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [fontsLoaded] = useFonts({ SairaCondensed_800ExtraBold, Barlow_400Regular, JetBrainsMono_600SemiBold });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  usePushRegistration(isAuthenticated);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        {isHydrating || !fontsLoaded ? <View style={styles.loadingRoot} /> : <RootNavigator />}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, backgroundColor: colors.background },
});

export default Sentry.wrap(App);
