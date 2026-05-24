import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseAuthStorage } from '@/lib/supabase-auth-storage';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase-config';

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Verifique o .env e reinicie com: npx expo start -c'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'hub',
  },
});

// Listener global de sessão inválida
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
    await AsyncStorage.clear();
  }
});

export { isSupabaseConfigured } from '@/lib/supabase-config';
