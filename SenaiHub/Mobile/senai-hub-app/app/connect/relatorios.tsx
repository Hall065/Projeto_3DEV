import { Alert, StyleSheet, View } from 'react-native';
import { ChartColumn, FileText, GraduationCap, TrendingUp } from 'lucide-react-native';
import {
  ListRow,
  MetricTile,
  MiniBars,
  RingMetric,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';

export default function RelatoriosConnectScreen() {
  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Relatórios"
      description="Relatórios acadêmicos, administrativos e de frequência."
      actionLabel="Exportar"
      onActionPress={() => Alert.alert('Exportação', 'Relatório acadêmico preparado para exportação.')}
    >
      <View style={styles.metricGrid}>
        <MetricTile
          label="Relatórios gerados"
          value={128}
          accent={connectTheme.accent}
          icon={<FileText size={16} color={connectTheme.accent} />}
          style={styles.metric}
        />
        <MetricTile
          label="Frequência média"
          value="92,4%"
          accent={colors.green}
          icon={<TrendingUp size={16} color={colors.green} />}
          style={styles.metric}
        />
        <MetricTile
          label="Cursos ativos"
          value={34}
          accent={colors.blue}
          icon={<GraduationCap size={16} color={colors.blue} />}
          style={styles.metric}
        />
        <MetricTile
          label="Indicadores"
          value={16}
          accent={colors.orange}
          icon={<ChartColumn size={16} color={colors.orange} />}
          style={styles.metric}
        />
      </View>

      <SurfaceCard title="Frequência geral" subtitle="Média por período">
        <MiniBars
          data={[
            { label: 'Manhã', value: 92, color: colors.green },
            { label: 'Tarde', value: 88, color: colors.blue },
            { label: 'Noite', value: 84, color: colors.orange },
          ]}
        />
      </SurfaceCard>

      <SurfaceCard title="Alunos por curso" subtitle="Distribuição por eixo">
        <View style={styles.ringRow}>
          <RingMetric value="42%" label="TI" accent={colors.blue} />
          <RingMetric value="31%" label="Automação" accent={connectTheme.accent} />
          <RingMetric value="27%" label="Outros" accent={colors.orange} />
        </View>
      </SurfaceCard>

      <SurfaceCard title="Arquivos recentes" subtitle="Relatórios disponíveis para consulta">
        <ListRow
          title="Frequência mensal - Maio"
          subtitle="PDF • gerado hoje"
          badge="Novo"
          badgeVariant="success"
          initials="FM"
          accent={colors.green}
        />
        <ListRow
          title="Alunos por empresa"
          subtitle="XLSX • atualizado ontem"
          badge="Planilha"
          badgeVariant="info"
          initials="AE"
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
});
