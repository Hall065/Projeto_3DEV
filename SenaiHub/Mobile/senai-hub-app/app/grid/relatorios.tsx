import { Alert, StyleSheet, View } from 'react-native';
import { ChartColumn, CheckCircle2, ClipboardList, TrendingUp } from 'lucide-react-native';
import {
  ListRow,
  MetricTile,
  MiniBars,
  ProgressBar,
  RingMetric,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';

export default function RelatoriosGridScreen() {
  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Relatórios"
      description="Indicadores de manutenção, custos e performance."
      actionLabel="Exportar"
      onActionPress={() => Alert.alert('Exportação', 'Relatório de manutenção preparado para exportação.')}
    >
      <View style={styles.metricGrid}>
        <MetricTile
          label="Ordens finalizadas"
          value={342}
          accent={gridTheme.accent}
          icon={<CheckCircle2 size={16} color={gridTheme.accent} />}
          style={styles.metric}
        />
        <MetricTile
          label="Tempo médio"
          value="4h"
          accent={colors.blue}
          icon={<TrendingUp size={16} color={colors.blue} />}
          style={styles.metric}
        />
        <MetricTile
          label="Custo mensal"
          value="R$ 32k"
          accent={colors.orange}
          icon={<ChartColumn size={16} color={colors.orange} />}
          style={styles.metric}
        />
        <MetricTile
          label="Chamados"
          value={128}
          accent={colors.red}
          icon={<ClipboardList size={16} color={colors.red} />}
          style={styles.metric}
        />
      </View>

      <SurfaceCard title="Manutenções por mês" subtitle="Volume de tarefas concluídas">
        <MiniBars
          data={[
            { label: 'Jan', value: 45, color: colors.blue },
            { label: 'Fev', value: 52, color: colors.green },
            { label: 'Mar', value: 66, color: colors.orange },
            { label: 'Abr', value: 74, color: colors.red },
            { label: 'Mai', value: 88, color: gridTheme.accent },
          ]}
        />
      </SurfaceCard>

      <SurfaceCard title="Tipos de manutenção" subtitle="Distribuição operacional">
        <View style={styles.ringRow}>
          <RingMetric value="342" label="Corretivas" accent={colors.blue} />
          <RingMetric value="128" label="Preventivas" accent={gridTheme.accent} />
          <RingMetric value="23" label="Críticas" accent={colors.red} />
        </View>
      </SurfaceCard>

      <SurfaceCard title="Custos por manutenção" subtitle="Itens e mão de obra">
        <View style={styles.progressStack}>
          <ProgressBar value={72} accent={colors.blue} />
          <ProgressBar value={54} accent={gridTheme.accent} />
          <ProgressBar value={33} accent={colors.orange} />
        </View>
      </SurfaceCard>

      <SurfaceCard title="Relatórios disponíveis" subtitle="Arquivos gerados recentemente">
        <ListRow
          title="Manutenção mensal - Maio"
          subtitle="PDF • gerado hoje às 09:40"
          badge="Novo"
          badgeVariant="success"
          initials="MM"
          accent={gridTheme.accent}
        />
        <ListRow
          title="Custos por centro"
          subtitle="XLSX • atualizado ontem"
          badge="Planilha"
          badgeVariant="info"
          initials="CC"
          accent={colors.blue}
        />
      </SurfaceCard>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: { width: '48%' },
  ringRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  progressStack: { gap: 14, paddingVertical: 8 },
});
