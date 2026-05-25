import { MiniBars, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';

interface ChartPlaceholderProps {
  title: string;
}

export function ChartPlaceholder({ title }: ChartPlaceholderProps) {
  return (
    <SurfaceCard title={title} subtitle="Resumo visual do período">
      <MiniBars
        data={[
          { label: 'Seg', value: 42, color: colors.red },
          { label: 'Ter', value: 64, color: colors.blue },
          { label: 'Qua', value: 58, color: colors.green },
          { label: 'Qui', value: 76, color: colors.orange },
          { label: 'Sex', value: 51, color: colors.purple },
        ]}
      />
    </SurfaceCard>
  );
}
