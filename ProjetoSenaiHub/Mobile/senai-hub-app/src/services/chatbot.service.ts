import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  id?: string;
  conversa_id?: string;
  usuario_id?: string;
  role: ChatMessageRole;
  conteudo: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

export type ChatConversation = {
  id: string;
  usuario_id?: string;
  titulo: string;
  status: 'ativa' | 'arquivada';
  created_at?: string;
  updated_at?: string;
};

type ChatResponse = {
  conversation_id: string;
  message: ChatMessage;
  metadata?: Record<string, unknown>;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const apiUrl =
  process.env.EXPO_PUBLIC_CHATBOT_API_URL ??
  extra.chatbotApiUrl ??
  'http://localhost:8000';

function getBaseUrl() {
  return apiUrl.replace(/\/+$/, '');
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Entre com uma conta autenticada para usar o assistente.');
  }
  return token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Nao consegui conectar ao assistente agora.';
    try {
      const payload = await response.json();
      message = payload.detail ?? payload.message ?? message;
    } catch {
      message = response.status === 404 ? 'Servico do assistente nao encontrado.' : message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const chatbotService = {
  listConversations() {
    return request<ChatConversation[]>('/conversations');
  },

  createConversation(titulo = 'Nova conversa') {
    return request<ChatConversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ titulo }),
    });
  },

  listMessages(conversationId: string) {
    return request<ChatMessage[]>(`/conversations/${conversationId}/messages`);
  },

  sendMessage(input: { conversationId?: string | null; message: string }) {
    return request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: input.conversationId ?? null,
        message: input.message,
      }),
    });
  },

  archiveConversation(conversationId: string) {
    return request<{ status: string }>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  },
};
