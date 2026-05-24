import { StyleSheet } from 'react-native';
import { Activity } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { MetricTile } from './VisualPrimitives';

interface MetricCardProps {
  label: string;
  value: string | number;
  accentColor?: string;
}

export function MetricCard({ label, value, accentColor = colors.navy }: MetricCardProps) {
  return (
    <MetricTile
      label={label}
      value={value}
      accent={accentColor}
      icon={<Activity size={16} color={accentColor} />}
      style={styles.metric}
    />
  );
}

const styles = StyleSheet.create({
  metric: { marginBottom: 12 },
});
