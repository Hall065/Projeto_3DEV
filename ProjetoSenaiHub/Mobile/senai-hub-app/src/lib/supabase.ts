import { createClient } from '@supabase/supabase-js';
import { supabaseAuthStorage } from '@/lib/supabase-auth-storage';
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseAuthStorageKey,
  supabaseUrl,
} from '@/lib/supabase-config';

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Verifique o .env e reinicie com: npx expo start -c'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    storageKey: supabaseAuthStorageKey,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'hub',
  },
});

export { isSupabaseConfigured } from '@/lib/supabase-config';
