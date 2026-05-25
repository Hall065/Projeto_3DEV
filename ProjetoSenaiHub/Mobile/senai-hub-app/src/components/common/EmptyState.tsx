import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: colors.grayText,
    textAlign: 'center',
  },
});
