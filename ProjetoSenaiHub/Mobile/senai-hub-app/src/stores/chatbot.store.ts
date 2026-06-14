import { create } from 'zustand';
import { chatbotService, type ChatConversation, type ChatMessage } from '@/services/chatbot.service';

interface ChatbotState {
  isOpen: boolean;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  open: () => void;
  close: () => void;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  createConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'O assistente esta temporariamente indisponivel.';
}

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversationId: null,
  messages: [],
  loadingConversations: false,
  loadingMessages: false,
  isSending: false,
  error: null,

  open: () => {
    set({ isOpen: true, error: null });
    void get().loadConversations();
  },

  close: () => set({ isOpen: false }),

  loadConversations: async () => {
    set({ loadingConversations: true, error: null });
    try {
      const conversations = (await chatbotService.listConversations()).filter(
        (conversation) => conversation.status !== 'arquivada'
      );
      set({ conversations, loadingConversations: false });

      const currentId = get().activeConversationId;
      if (!currentId && conversations[0]) {
        await get().selectConversation(conversations[0].id);
      }
    } catch (error) {
      set({ loadingConversations: false, error: getErrorMessage(error) });
    }
  },

  selectConversation: async (conversationId: string) => {
    set({ activeConversationId: conversationId, loadingMessages: true, error: null });
    try {
      const messages = await chatbotService.listMessages(conversationId);
      set({ messages, loadingMessages: false });
    } catch (error) {
      set({ loadingMessages: false, error: getErrorMessage(error) });
    }
  },

  createConversation: async () => {
    set({ loadingMessages: true, error: null });
    try {
      const conversation = await chatbotService.createConversation();
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
        messages: [],
        loadingMessages: false,
      }));
    } catch (error) {
      set({ loadingMessages: false, error: getErrorMessage(error) });
    }
  },

  sendMessage: async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || get().isSending) return;

    const activeConversationId = get().activeConversationId;
    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      conteudo: trimmed,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
      isSending: true,
      error: null,
    }));

    try {
      const response = await chatbotService.sendMessage({
        conversationId: activeConversationId,
        message: trimmed,
      });

      set((state) => ({
        activeConversationId: response.conversation_id,
        messages: [...state.messages, response.message],
        isSending: false,
      }));

      await get().loadConversations();
    } catch (error) {
      set({ isSending: false, error: getErrorMessage(error) });
    }
  },

  clearError: () => set({ error: null }),
}));
