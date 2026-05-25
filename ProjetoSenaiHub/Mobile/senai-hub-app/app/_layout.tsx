import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout() {
  const { hydrate, isInitialized } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
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
  );
}
