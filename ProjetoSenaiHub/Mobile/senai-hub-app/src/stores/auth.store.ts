import { create } from 'zustand';
import type { AuthSession } from '@/types/auth.types';
import * as authService from '@/services/auth.service';
import { stopStudentGeofence } from '@/tasks/geofenceTask';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: false,
  isInitialized: false,

  setSession: (session) => set({ session }),

  login: async (email, password) => {
    set({ isLoading: true });
    const { session, error } = await authService.login(email, password);
    set({ session, isLoading: false });
    return error;
  },

  loginAsGuest: () => {
    const guestId = '00000000-0000-0000-0000-000000000000';
    set({
      session: {
        userId: guestId,
        email: 'visitante@senai.br',
        perfil: {
          id: guestId,
          nome: 'Visitante (Teste)',
          email_institucional: 'visitante@senai.br',
          tipo: 'admin',
          status: 'ativo',
        },
        aplicacoes: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            usuario_id: guestId,
            aplicacao_id: '00000000-0000-0000-0000-000000000010',
            aplicacao_codigo: 'senai_connect',
            aplicacao_nome: 'SENAI Connect',
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            usuario_id: guestId,
            aplicacao_id: '00000000-0000-0000-0000-000000000020',
            aplicacao_codigo: 'senai_grid',
            aplicacao_nome: 'SENAI Grid',
          },
        ],
      },
    });
  },

  logout: async () => {
    await stopStudentGeofence();
    await authService.logout();
    set({ session: null });
  },

  hydrate: async () => {
    try {
      set({ isLoading: true });
      const session = await authService.initializeAuth();
      if (session) {
        const fullSession = await authService.getCurrentSession();
        set({ session: fullSession, isLoading: false, isInitialized: true });
      } else {
        set({ session: null, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('[AuthStore] Erro ao inicializar sessão:', error);
      set({ session: null, isLoading: false, isInitialized: true });
    }
  },
}));
