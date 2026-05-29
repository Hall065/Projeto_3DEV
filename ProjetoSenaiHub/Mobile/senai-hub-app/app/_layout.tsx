import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingState } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { hydrate, isInitialized } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <LoadingState label="Preparando o SENAI Hub..." />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="recuperar-senha" />
          <Stack.Screen name="redefinir-senha" />
          <Stack.Screen name="hub" />
          <Stack.Screen name="connect" />
          <Stack.Screen name="grid" />
        </Stack>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
