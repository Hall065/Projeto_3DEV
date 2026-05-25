import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { fetchUserProfile, fetchUserApplications } from '@/services/hub.service';
import type { AuthSession } from '@/types/auth.types';
import { mapAuthErrorMessage } from '@/lib/auth-errors';

// Opção 4 — Inicializar sessão com tratamento de erro
export async function initializeAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Sessão inválida, limpando cache...');
      await AsyncStorage.clear();
      await supabase.auth.signOut();
      return null;
    }

    return session;

  } catch (err) {
    console.error('[AuthService] Erro ao inicializar auth:', err);
    await AsyncStorage.clear();
    await supabase.auth.signOut();
    return null;
  }
}

// Login
export async function login(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // 1. Autenticar via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      return { session: null, error: mapAuthErrorMessage(authError.message) };
    }

    if (!authData.user) {
      return { session: null, error: 'Usuário não autenticado.' };
    }

    // 2. Buscar perfil em hub.usuarios
    const perfil = await fetchUserProfile(normalizedEmail);

    if (!perfil) {
      // Fallback para desenvolvimento (ajuda na entrega se o banco estiver instável)
      if (__DEV__) {
        console.warn('[AuthService] Perfil não encontrado, criando fallback em tempo real.');
        const tempPerfil = {
          id: authData.user.id,
          nome: normalizedEmail.split('@')[0],
          email_institucional: normalizedEmail,
          tipo: 'admin' as any,
          status: 'ativo' as any,
        };
        return {
          session: {
            userId: authData.user.id,
            email: normalizedEmail,
            perfil: tempPerfil as any,
            aplicacoes: [
              { id: '1', usuario_id: authData.user.id, aplicacao_id: 'connect', aplicacao_codigo: 'senai_connect' },
              { id: '2', usuario_id: authData.user.id, aplicacao_id: 'grid', aplicacao_codigo: 'senai_grid' }
            ],
          },
          error: null,
        };
      }

      await supabase.auth.signOut();
      return { 
        session: null, 
        error: 'Perfil não encontrado em hub.usuarios.' 
      };
    }

    // 3. Verificar se está ativo
    if (perfil.status !== 'ativo') {
      await supabase.auth.signOut();
      return { 
        session: null, 
        error: perfil.status === 'bloqueado' 
          ? 'Sua conta está bloqueada. Contate o administrador.' 
          : 'Sua conta está inativa. Contate o administrador.'
      };
    }

    // 4. Buscar aplicações liberadas em hub.usuario_aplicacoes
    const aplicacoes = await fetchUserApplications(authData.user.id);

    return {
      session: {
        userId: authData.user.id,
        email: authData.user.email ?? normalizedEmail,
        perfil,
        aplicacoes: aplicacoes ?? [],
      },
      error: null,
    };
  } catch (err: any) {
    console.error('[AuthService] Erro no login:', err);
    return { session: null, error: 'Erro inesperado ao realizar login.' };
  }
}

export async function resetPasswordForEmail(email: string): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

  return {
    error: error ? mapAuthErrorMessage(error.message) : null,
  };
}

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password });

  return {
    error: error ? mapAuthErrorMessage(error.message) : null,
  };
}

// Logout
export async function logout() {
  await AsyncStorage.clear();
  await supabase.auth.signOut();
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const userEmail = data.session.user.email;
  if (!userEmail) return null;

  const perfil = await fetchUserProfile(userEmail);
  if (!perfil) return null;

  const aplicacoes = await fetchUserApplications(data.session.user.id);

  return {
    userId: data.session.user.id,
    email: data.session.user.email ?? '',
    perfil,
    aplicacoes,
  };
}
