import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { SendHorizonal } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const theme = useThemeColors();
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !disabled;

  function handleSend() {
    const message = value.trim();
    if (!message || disabled) return;
    setValue('');
    onSend(message);
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <TextInput
        style={[styles.input, { color: theme.text }]}
        placeholder="Pergunte sobre alunos, turmas, chamados..."
        placeholderTextColor={theme.textSubtle}
        value={value}
        onChangeText={setValue}
        multiline
        maxLength={1800}
        editable={!disabled}
        returnKeyType="send"
      />
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
        disabled={!canSend}
        style={[
          styles.sendButton,
          {
            backgroundColor: canSend ? colors.red : theme.surfaceSoft,
            borderColor: canSend ? colors.red : theme.line,
          },
        ]}
        onPress={handleSend}
      >
        {disabled ? <ActivityIndicator size="small" color={theme.textMuted} /> : <SendHorizonal size={18} color={canSend ? colors.white : theme.textMuted} />}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 54,
    maxHeight: 116,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 92,
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
