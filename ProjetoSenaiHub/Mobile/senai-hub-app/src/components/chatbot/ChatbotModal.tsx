import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BotMessageSquare, RefreshCw, X } from 'lucide-react-native';
import { AnimatedPressable, FeedbackMessage } from '@/components/common/VisualPrimitives';
import { ChatInput } from '@/components/chatbot/ChatInput';
import { ChatMessageBubble } from '@/components/chatbot/ChatMessageBubble';
import { ConversationList } from '@/components/chatbot/ConversationList';
import { colors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useChatbotStore } from '@/stores/chatbot.store';

const SUGGESTIONS = [
  'Quantos alunos tem cadastrados?',
  'Quantos alunos foram cadastrados hoje?',
  'Resumo dos chamados abertos',
  'Como esta a frequencia das turmas?',
  'Quais itens estao com estoque critico?',
];

export function ChatbotModal() {
  const theme = useThemeColors();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const isWide = width >= 720;
  const {
    isOpen,
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    isSending,
    error,
    close,
    loadConversations,
    selectConversation,
    createConversation,
    sendMessage,
    clearError,
  } = useChatbotStore();

  useEffect(() => {
    if (isOpen) {
      void loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [isOpen, messages.length, isSending]);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
      >
        <View
          style={[
            styles.sheet,
            {
              width: isWide ? 520 : '100%',
              maxHeight: isWide ? '86%' : '90%',
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <View style={[styles.titleIcon, { backgroundColor: theme.surfaceSoft, borderColor: theme.line }]}>
                <BotMessageSquare size={18} color={theme.isDark ? colors.white : colors.red} />
              </View>
              <View style={styles.titleCopy}>
                <Text style={[styles.title, { color: theme.text }]}>Assistente SENAI Hub</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Dados do app em conversa profissional</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Atualizar conversas"
                style={[styles.iconButton, { backgroundColor: theme.surfaceSoft, borderColor: theme.line }]}
                onPress={() => {
                  clearError();
                  void loadConversations();
                }}
              >
                <RefreshCw size={17} color={theme.text} />
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Fechar assistente"
                style={[styles.iconButton, { backgroundColor: theme.surfaceSoft, borderColor: theme.line }]}
                onPress={close}
              >
                <X size={18} color={theme.text} />
              </AnimatedPressable>
            </View>
          </View>

          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingConversations}
            onCreate={() => void createConversation()}
            onSelect={(id) => void selectConversation(id)}
          />

          {error ? <FeedbackMessage variant="warning" message={error} /> : null}

          <ScrollView
            ref={scrollRef}
            style={[styles.messages, { backgroundColor: theme.surfaceMuted, borderColor: theme.line }]}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {loadingMessages ? (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.textMuted} />
                <Text style={[styles.loadingText, { color: theme.textMuted }]}>Carregando conversa...</Text>
              </View>
            ) : null}

            {!loadingMessages && messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Como posso ajudar?</Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Pergunte sobre alunos, turmas, frequencia, chamados, tarefas ou estoque.
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((suggestion) => (
                    <AnimatedPressable
                      key={suggestion}
                      accessibilityRole="button"
                      style={[styles.suggestion, { backgroundColor: theme.surface, borderColor: theme.line }]}
                      onPress={() => void sendMessage(suggestion)}
                    >
                      <Text style={[styles.suggestionText, { color: theme.text }]}>{suggestion}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </View>
            ) : null}

            {messages.map((message, index) => (
              <ChatMessageBubble key={message.id ?? `${message.role}-${index}`} message={message} />
            ))}

            {isSending ? (
              <View style={styles.typing}>
                <ActivityIndicator size="small" color={theme.textMuted} />
                <Text style={[styles.typingText, { color: theme.textMuted }]}>Assistente respondendo...</Text>
              </View>
            ) : null}
          </ScrollView>

          <ChatInput disabled={isSending} onSend={(message) => void sendMessage(message)} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 0,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '900' },
  subtitle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flexGrow: 1,
    minHeight: 280,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 16,
  },
  loading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 12, fontWeight: '800' },
  emptyState: {
    minHeight: 220,
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  suggestions: { gap: 8, marginTop: 4 },
  suggestion: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: { fontSize: 12, fontWeight: '800' },
  typing: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  typingText: { fontSize: 12, fontWeight: '800' },
});
