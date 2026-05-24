import { useEffect, useState } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import {
  applyInputMask,
  formatInitialFormValues,
  getKeyboardTypeForMask,
  isMaskedValueComplete,
  normalizeFormValues,
  resolveInputMask,
  type InputMask,
} from '@/utils/formatters';

export interface CrudField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  mask?: InputMask;
}

interface CrudModalProps {
  visible: boolean;
  title: string;
  fields: CrudField[];
  initialValues?: Record<string, string>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
}

export function CrudModal({
  visible,
  title,
  fields,
  initialValues,
  isSubmitting,
  submitLabel = 'Salvar',
  onClose,
  onSubmit,
}: CrudModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValues(formatInitialFormValues(initialValues, fields));
      setError(null);
    }
  }, [fields, initialValues, visible]);

  const handleSubmit = async () => {
    const missing = fields.find((field) => field.required && !values[field.name]?.trim());
    if (missing) {
      setError(`Preencha o campo ${missing.label}.`);
      return;
    }
    const incomplete = fields.find((field) => !isMaskedValueComplete(field, values[field.name] ?? ''));
    if (incomplete) {
      setError(`Preencha o campo ${incomplete.label} no formato correto.`);
      return;
    }
    setError(null);
    await onSubmit(normalizeFormValues(values, fields));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X size={18} color={colors.navy} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {fields.map((field) => {
              const mask = resolveInputMask(field);
              return (
                <View key={field.name} style={styles.field}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? <Text style={styles.required}> *</Text> : null}
                  </Text>
                  <TextInput
                    style={[styles.input, field.multiline && styles.inputMultiline]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedText}
                    value={values[field.name] ?? ''}
                    onChangeText={(value) =>
                      setValues((current) => ({ ...current, [field.name]: applyInputMask(field, value) }))
                    }
                    multiline={field.multiline}
                    secureTextEntry={field.secureTextEntry}
                    keyboardType={field.keyboardType ?? getKeyboardTypeForMask(mask)}
                  />
                </View>
              );
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={onClose} disabled={isSubmitting}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitText}>{submitLabel}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  title: { flex: 1, color: colors.navy, fontSize: 18, fontWeight: '900' },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: 8 },
  field: { marginBottom: 12 },
  label: { color: colors.navy, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  required: { color: colors.red },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.navy,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMultiline: { minHeight: 86, textAlignVertical: 'top' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  submitButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: colors.white, fontSize: 13, fontWeight: '900' },
});
