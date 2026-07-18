import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { queryClient } from './src/store/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { startMockServer } from './src/mocks/setup';

// Start MSW mock server in development
if (__DEV__) {
  startMockServer();
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
