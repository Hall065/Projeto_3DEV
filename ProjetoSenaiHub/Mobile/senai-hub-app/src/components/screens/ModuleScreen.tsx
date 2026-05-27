import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, LoadingState } from '@/components/common/VisualPrimitives';
import { EmptyState } from '@/components/common/EmptyState';
import { colors } from '@/constants/colors';

interface ModuleScreenProps {
  title: string;
  description: string;
  kicker?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  tone?: 'light' | 'dark';
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  children?: ReactNode;
}

export function ModuleScreen({
  title,
  description,
  kicker,
  actionLabel,
  onActionPress,
  tone = 'light',
  isLoading,
  isEmpty,
  emptyTitle = 'Nenhum registro encontrado',
  children,
}: ModuleScreenProps) {
  const dark = tone === 'dark';

  return (
    <ScrollView
      style={[styles.container, dark && styles.containerDark]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <View style={styles.headingText}>
          {kicker ? <Text style={[styles.kicker, dark && styles.kickerDark]}>{kicker}</Text> : null}
          <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
          <Text style={[styles.description, dark && styles.descriptionDark]}>{description}</Text>
        </View>
        {actionLabel ? (
          <AppButton
            label={actionLabel}
            onPress={onActionPress}
            disabled={!onActionPress}
            accent={dark ? colors.green : colors.red}
            tone={tone}
            style={styles.actionButton}
            textStyle={styles.actionButtonText}
          />
        ) : null}
      </View>

      {isLoading ? (
        <LoadingState tone={tone} />
      ) : isEmpty ? (
        <EmptyState title={emptyTitle} description="Os dados aparecerão após conectar o Supabase." />
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerDark: { backgroundColor: colors.navyDark },
  content: { padding: 16, paddingBottom: 28 },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    paddingTop: 2,
  },
  headingText: { flex: 1, minWidth: 0 },
  kicker: {
    color: colors.red,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kickerDark: { color: colors.green },
  title: { color: colors.navy, fontSize: 24, fontWeight: '900' },
  titleDark: { color: colors.white },
  description: { color: colors.grayText, fontSize: 12, marginTop: 4 },
  descriptionDark: { color: colors.mutedText },
  actionButton: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  actionButtonText: { fontSize: 11 },
  body: { flex: 1 },
});
