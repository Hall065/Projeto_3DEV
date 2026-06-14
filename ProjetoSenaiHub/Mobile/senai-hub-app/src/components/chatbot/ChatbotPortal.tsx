import { usePathname } from 'expo-router';
import { ChatbotFloatingButton } from '@/components/chatbot/ChatbotFloatingButton';
import { ChatbotModal } from '@/components/chatbot/ChatbotModal';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/auth.store';
import { useChatbotStore } from '@/stores/chatbot.store';

const HIDDEN_ROUTES = new Set([
  '/login',
  '/recuperar-senha',
  '/redefinir-senha',
  ROUTES.hub,
  '/perfil',
  ROUTES.aluno.perfil,
]);

export function ChatbotPortal() {
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const open = useChatbotStore((state) => state.open);

  if (!session || HIDDEN_ROUTES.has(pathname)) {
    return null;
  }

  return (
    <>
      <ChatbotFloatingButton onPress={open} />
      <ChatbotModal />
    </>
  );
}
