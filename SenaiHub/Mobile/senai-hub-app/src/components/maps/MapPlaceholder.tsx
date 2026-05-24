import { View } from 'react-native';
import { CampusMap, ListRow, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors } from '@/constants/colors';

interface MapPlaceholderProps {
  title?: string;
}

export function MapPlaceholder({ title = 'Mapa do campus' }: MapPlaceholderProps) {
  return (
    <SurfaceCard title={title} subtitle="Blocos, salas e pontos ativos">
      <CampusMap />
      <View>
        <ListRow
          title="Ana Paula"
          subtitle="Oficina 02 - aula em andamento"
          meta="08:32"
          badge="No campus"
          badgeVariant="success"
          initials="AP"
          accent={colors.green}
        />
        <ListRow
          title="Gabriel Santos"
          subtitle="Bloco B - chegada recente"
          meta="08:41"
          badge="Entrada"
          badgeVariant="info"
          initials="GS"
          accent={colors.blue}
        />
      </View>
    </SurfaceCard>
  );
}
