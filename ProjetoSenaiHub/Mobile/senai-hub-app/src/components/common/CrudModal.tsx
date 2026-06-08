import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { KeyboardTypeOptions } from 'react-native';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera, X } from 'lucide-react-native';
import { AnimatedPressable, AppButton, FeedbackMessage } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { useThemeColors } from '@/hooks/useThemeColors';
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
  type?: 'text' | 'image';
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
  const theme = useThemeColors();
  const { t } = useI18n();
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

  const pickImage = async (fieldName: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita acesso Ã galeria para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
      base64: Platform.OS === 'web',
    });

    const asset = result.canceled ? null : result.assets[0];
    if (asset?.uri) {
      const imageUri =
        Platform.OS === 'web' && asset.base64
          ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
      setValues((current) => ({ ...current, [fieldName]: imageUri }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{t(title)}</Text>
            <AnimatedPressable style={[styles.closeButton, { backgroundColor: theme.surfaceSoft }]} onPress={onClose}>
              <X size={18} color={theme.text} />
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
                  <Text style={[styles.label, { color: theme.text }]}>
                    {t(field.label)}
                    {field.required ? <Text style={styles.required}> *</Text> : null}
                  </Text>
                  {field.type === 'image' ? (
                    <View style={styles.imageField}>
                      {fieldValue ? (
                        <Image source={{ uri: fieldValue }} style={styles.imagePreview} />
                      ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: theme.surfaceSoft, borderColor: theme.line }]}>
                          <Camera size={22} color={theme.textMuted} />
                        </View>
                      )}
                      <AppButton
                        label={fieldValue ? 'Trocar imagem' : 'Selecionar imagem'}
                        variant="secondary"
                        accent={colors.navy}
                          icon={<Camera size={16} color={theme.isDark ? theme.text : colors.navy} />}
                          onPress={() => pickImage(field.name)}
                        />
                    </View>
                  ) : field.options ? (
                    <View style={styles.optionList}>
                      {selectOptions.length === 0 ? (
                        <Text style={[styles.emptyOptions, { color: theme.textMuted }]}>{t('Nenhum dado cadastrado ainda.')}</Text>
                      ) : (
                        selectOptions.map((option) => {
                          const selected = fieldValue === option.value;
                          return (
                            <AnimatedPressable
                              key={`${field.name}-${option.value || 'empty'}`}
                              style={[
                                styles.optionButton,
                                {
                                  backgroundColor: theme.input,
                                  borderColor: theme.line,
                                },
                                selected && styles.optionButtonSelected,
                              ]}
                              onPress={() =>
                                setValues((current) => ({ ...current, [field.name]: option.value }))
                              }
                            >
                              <Text style={[styles.optionLabel, { color: theme.text }, selected && styles.optionLabelSelected]}>
                                {t(option.label)}
                              </Text>
                              {option.description ? (
                                <Text
                                  style={[
                                    styles.optionDescription,
                                    { color: theme.textMuted },
                                    selected && { color: theme.isDark ? theme.text : colors.navy },
                                  ]}
                                >
                                  {t(option.description)}
                                </Text>
                              ) : null}
                            </AnimatedPressable>
                          );
                        })
                      )}
                    </View>
                  ) : (
                    <TextInput
                      accessibilityLabel={field.name}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.input,
                          borderColor: theme.line,
                          color: theme.text,
                        },
                        field.multiline && styles.inputMultiline,
                      ]}
                      placeholder={t(field.placeholder ?? field.label)}
                      placeholderTextColor={theme.textSubtle}
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
  imageField: { gap: 10 },
  imagePreview: {
    width: 92,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft,
  },
  imagePlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButtonWrap: { flex: 1 },
});
