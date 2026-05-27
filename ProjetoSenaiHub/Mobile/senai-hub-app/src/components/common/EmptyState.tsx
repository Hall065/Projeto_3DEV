import { StyleSheet, Text, View } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Inbox size={26} color={colors.blue} />
      </View>
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
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#C7DAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
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
