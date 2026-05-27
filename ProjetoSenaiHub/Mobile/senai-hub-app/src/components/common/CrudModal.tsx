import { useEffect, useState } from 'react';
import type { KeyboardTypeOptions } from 'react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { AnimatedPressable, AppButton, FeedbackMessage } from '@/components/common/VisualPrimitives';
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

export interface CrudOption {
  value: string;
  label: string;
  description?: string;
}

export interface CrudField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  mask?: InputMask;
  options?: CrudOption[];
  emptyOptionLabel?: string;
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

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return 'Não foi possível salvar o registro. Tente novamente.';
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
    try {
      await onSubmit(normalizeFormValues(values, fields));
    } catch (err) {
      setError(getErrorMessage(err));
    }
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
            <AnimatedPressable style={styles.closeButton} onPress={onClose}>
              <X size={18} color={colors.navy} />
            </AnimatedPressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {fields.map((field) => {
              const mask = resolveInputMask(field);
              const fieldValue = values[field.name] ?? '';
              const selectOptions = field.options
                ? field.required
                  ? field.options
                  : [{ value: '', label: field.emptyOptionLabel ?? 'Sem vinculo' }, ...field.options]
                : [];
              return (
                <View key={field.name} style={styles.field}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? <Text style={styles.required}> *</Text> : null}
                  </Text>
                  {field.options ? (
                    <View style={styles.optionList}>
                      {selectOptions.length === 0 ? (
                        <Text style={styles.emptyOptions}>Nenhum dado cadastrado ainda.</Text>
                      ) : (
                        selectOptions.map((option) => {
                          const selected = fieldValue === option.value;
                          return (
                            <AnimatedPressable
                              key={`${field.name}-${option.value || 'empty'}`}
                              style={[styles.optionButton, selected && styles.optionButtonSelected]}
                              onPress={() =>
                                setValues((current) => ({ ...current, [field.name]: option.value }))
                              }
                            >
                              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                                {option.label}
                              </Text>
                              {option.description ? (
                                <Text
                                  style={[
                                    styles.optionDescription,
                                    selected && styles.optionDescriptionSelected,
                                  ]}
                                >
                                  {option.description}
                                </Text>
                              ) : null}
                            </AnimatedPressable>
                          );
                        })
                      )}
                    </View>
                  ) : (
                    <TextInput
                      style={[styles.input, field.multiline && styles.inputMultiline]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.mutedText}
                      value={fieldValue}
                      onChangeText={(value) =>
                        setValues((current) => ({ ...current, [field.name]: applyInputMask(field, value) }))
                      }
                      multiline={field.multiline}
                      secureTextEntry={field.secureTextEntry}
                      keyboardType={field.keyboardType ?? getKeyboardTypeForMask(mask)}
                    />
                  )}
                </View>
              );
            })}

            {error ? <FeedbackMessage variant="danger" message={error} /> : null}

            <View style={styles.actions}>
              <AppButton
                label="Cancelar"
                variant="secondary"
                accent={colors.navy}
                onPress={onClose}
                disabled={isSubmitting}
                wrapperStyle={styles.actionButtonWrap}
              />
              <AppButton
                label={submitLabel}
                accent={colors.red}
                onPress={handleSubmit}
                loading={isSubmitting}
                wrapperStyle={styles.actionButtonWrap}
              />
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
  optionList: { gap: 8 },
  optionButton: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: colors.red,
    backgroundColor: colors.panelSoft,
  },
  optionLabel: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  optionLabelSelected: { color: colors.red },
  optionDescription: { color: colors.grayText, fontSize: 11, fontWeight: '700', marginTop: 2 },
  optionDescriptionSelected: { color: colors.navy },
  emptyOptions: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButtonWrap: { flex: 1 },
});
