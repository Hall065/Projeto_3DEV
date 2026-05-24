import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
          <Pressable
            style={[styles.actionButton, dark && styles.actionButtonDark]}
            onPress={onActionPress}
            disabled={!onActionPress}
          >
            <Text style={[styles.actionButtonText, dark && styles.actionButtonTextDark]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={dark ? colors.white : colors.navy}
          style={styles.loader}
        />
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
  content: { padding: 14, paddingBottom: 28 },
  heading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
    borderRadius: 8,
    backgroundColor: colors.red,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonDark: { backgroundColor: colors.green },
  actionButtonText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  actionButtonTextDark: { color: colors.navyDark },
  loader: { marginTop: 40 },
  body: { flex: 1 },
});
