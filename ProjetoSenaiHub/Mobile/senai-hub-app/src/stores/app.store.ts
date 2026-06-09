import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppModule = 'hub' | 'connect' | 'grid';
export type ThemeMode = 'light' | 'dark';

export const APP_LANGUAGE_OPTIONS = [
  { code: 'pt-BR', azureCode: 'pt', label: 'Português (Brasil)' },
  { code: 'en-US', azureCode: 'en', label: 'Inglês' },
  { code: 'es-ES', azureCode: 'es', label: 'Espanhol' },
  { code: 'fr-FR', azureCode: 'fr', label: 'Francês' },
  { code: 'de-DE', azureCode: 'de', label: 'Alemão' },
  { code: 'it-IT', azureCode: 'it', label: 'Italiano' },
  { code: 'ja-JP', azureCode: 'ja', label: 'Japonês' },
  { code: 'zh-Hans', azureCode: 'zh-Hans', label: 'Chinês simplificado' },
] as const;

export type AppLanguage = (typeof APP_LANGUAGE_OPTIONS)[number]['code'];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return APP_LANGUAGE_OPTIONS.some((option) => option.code === value);
}

export function getAppLanguageOption(language: AppLanguage) {
  return APP_LANGUAGE_OPTIONS.find((option) => option.code === language) ?? APP_LANGUAGE_OPTIONS[0];
}

export function getAzureLanguageCode(language: AppLanguage): string | null {
  if (language === 'pt-BR') return null;
  return getAppLanguageOption(language).azureCode;
}

const PREFERENCES_KEY = '@senai-hub/preferences';

interface AppState {
  activeModule: AppModule;
  sidebarOpen: boolean;
  themeMode: ThemeMode;
  language: AppLanguage;
  preferencesInitialized: boolean;
  setActiveModule: (module: AppModule) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  hydratePreferences: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setLanguage: (language: AppLanguage) => void;
}

async function savePreferences(themeMode: ThemeMode, language: AppLanguage) {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({ themeMode, language }));
  } catch (error) {
    console.warn('[Preferences] Nao foi possivel salvar preferencias:', error);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  activeModule: 'hub',
  sidebarOpen: false,
  themeMode: 'light',
  language: 'pt-BR',
  preferencesInitialized: false,
  setActiveModule: (activeModule) => set({ activeModule }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  hydratePreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (!raw) {
        set({ preferencesInitialized: true });
        return;
      }

      const parsed = JSON.parse(raw) as Partial<Pick<AppState, 'themeMode' | 'language'>>;
      set({
        themeMode: parsed.themeMode === 'dark' ? 'dark' : 'light',
        language: isAppLanguage(parsed.language) ? parsed.language : 'pt-BR',
        preferencesInitialized: true,
      });
    } catch (error) {
      console.warn('[Preferences] Nao foi possivel carregar preferencias:', error);
      set({ preferencesInitialized: true });
    }
  },
  setThemeMode: (themeMode) => {
    const { language } = get();
    set({ themeMode });
    void savePreferences(themeMode, language);
  },
  toggleThemeMode: () => {
    const { themeMode, language } = get();
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    set({ themeMode: nextMode });
    void savePreferences(nextMode, language);
  },
  setLanguage: (language) => {
    const { themeMode } = get();
    set({ language });
    void savePreferences(themeMode, language);
  },
}));
