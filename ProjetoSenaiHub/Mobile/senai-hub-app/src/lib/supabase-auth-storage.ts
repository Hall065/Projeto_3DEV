import { Platform } from 'react-native';

/** Node/SSR (Expo Web): sem `window` — não acessar localStorage nem AsyncStorage web. */
function isServer(): boolean {
  return typeof window === 'undefined';
}

async function getNativeStorage() {
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  return AsyncStorage;
}

/**
 * Storage do Supabase Auth compatível com SSR.
 * - Servidor: no-op (sessão só no cliente)
 * - Web (cliente): localStorage
 * - Native: AsyncStorage (import dinâmico, evita bundle web no SSR)
 */
export const supabaseAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer()) return null;
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(key);
    }
    const storage = await getNativeStorage();
    return storage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer()) return;
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
      return;
    }
    const storage = await getNativeStorage();
    await storage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer()) return;
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
      return;
    }
    const storage = await getNativeStorage();
    await storage.removeItem(key);
  },
};

export async function clearSupabaseAuthStorage(storageKey: string) {
  await Promise.all([
    supabaseAuthStorage.removeItem(storageKey),
    supabaseAuthStorage.removeItem(`${storageKey}-user`),
    supabaseAuthStorage.removeItem(`${storageKey}-code-verifier`),
  ]);
}
