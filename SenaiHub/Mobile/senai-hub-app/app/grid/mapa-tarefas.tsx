import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Clock3, MapPin } from 'lucide-react-native';
import { CampusMap, ListRow, MetricTile, Pill, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { gridService } from '@/services/grid.service';
import type { Chamado } from '@/types/grid.types';

export default function MapaTarefasScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Chamado[]>([]);

  useEffect(() => {
    gridService
      .listChamados()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Mapa de tarefas"
      description="Visualize serviços por bloco, sala e criticidade."
      isLoading={loading}
    >
      <SurfaceCard title="Mapa do SENAI" subtitle="Pins coloridos indicam o status dos chamados">
        <CampusMap />
        <View style={styles.legend}>
          <Pill label="Aberto" variant="warning" />
          <Pill label="Em andamento" variant="info" />
          <Pill label="Concluído" variant="success" />
          <Pill label="Crítico" variant="danger" />
        </View>
      </SurfaceCard>

      <View style={styles.metricGrid}>
        <MetricTile label="Tarefas no mapa" value={items.length} accent={colors.blue} icon={<MapPin size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Em andamento" value={items.filter((i) => i.status === 'em_andamento').length} accent={colors.orange} icon={<Clock3 size={16} color={colors.orange} />} style={styles.metric} />
        <MetricTile label="Finalizadas" value={items.filter((i) => i.status === 'concluido').length} accent={gridTheme.accent} icon={<CheckCircle2 size={16} color={gridTheme.accent} />} style={styles.metric} />
        <MetricTile label="Atrasadas" value={items.filter((i) => i.prioridade === 'urgente').length} accent={colors.red} icon={<AlertTriangle size={16} color={colors.red} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Tarefas no mapa" subtitle="Serviços próximos da sua localização">
        {items.slice(0, 8).map((item) => (
          <ListRow
            key={item.id}
            title={item.titulo}
            subtitle={`${item.bloco_nome ?? 'Bloco não informado'} • ${item.sala_nome ?? 'Sala não informada'}`}
            badge={item.prioridade}
            badgeVariant={item.prioridade === 'urgente' ? 'danger' : item.status === 'concluido' ? 'success' : 'warning'}
            meta={item.status}
            initials="MP"
            accent={item.prioridade === 'urgente' ? colors.red : colors.orange}
          />
        ))}
      </SurfaceCard>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
});
