import { ChartCard, InteractiveBarChart } from '@/components/charts';
import { colors } from '@/constants/colors';

interface ChartPlaceholderProps {
  title: string;
}

export function ChartPlaceholder({ title }: ChartPlaceholderProps) {
  return (
    <ChartCard title={title} subtitle="Resumo visual do periodo">
      <InteractiveBarChart
        data={[
          { label: 'Seg', value: 42, color: colors.red },
          { label: 'Ter', value: 64, color: colors.blue },
          { label: 'Qua', value: 58, color: colors.green },
          { label: 'Qui', value: 76, color: colors.orange },
          { label: 'Sex', value: 51, color: colors.purple },
        ]}
      />
    </ChartCard>
  );
}
