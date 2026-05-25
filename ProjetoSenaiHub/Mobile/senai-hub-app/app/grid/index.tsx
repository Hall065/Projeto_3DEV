import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle, CheckCircle2, ClipboardList, Wrench } from 'lucide-react-native';
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
import { gridService } from '@/services/grid.service';

export default function GridDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    chamadosAbertos: 0,
    chamadosEmAndamento: 0,
    itensEstoqueBaixo: 0,
  });

  useEffect(() => {
    gridService
      .getDashboardMetrics()
      .then(setMetrics)
      .catch(() =>
        setMetrics({ chamadosAbertos: 0, chamadosEmAndamento: 0, itensEstoqueBaixo: 0 })
      )
      .finally(() => setLoading(false));
  }, []);

  const chamadosAbertos = metrics.chamadosAbertos || 128;
  const emAndamento = metrics.chamadosEmAndamento || 64;
  const estoqueBaixo = metrics.itensEstoqueBaixo || 23;

  return (
    <ModuleScreen
      kicker="SENAI Grid"
      title="Dashboard"
      description="Resumo operacional da manutenção e infraestrutura."
      isLoading={loading}
    >
      <View style={styles.metricGrid}>
        <MetricTile
          label="Chamados abertos"
          value={chamadosAbertos}
          hint="+12%"
          accent={gridTheme.accent}
          icon={<ClipboardList size={16} color={gridTheme.accent} />}
          style={styles.metric}
        />
        <MetricTile
          label="Em andamento"
          value={emAndamento}
          hint="24h"
          accent={colors.orange}
          icon={<Wrench size={16} color={colors.orange} />}
          style={styles.metric}
        />
        <MetricTile
          label="Concluídos no mês"
          value="342"
          hint="+8%"
          accent={colors.green}
          icon={<CheckCircle2 size={16} color={colors.green} />}
          style={styles.metric}
        />
        <MetricTile
          label="Estoque crítico"
          value={estoqueBaixo}
          hint="Atenção"
          accent={colors.red}
          icon={<AlertTriangle size={16} color={colors.red} />}
          style={styles.metric}
        />
      </View>

      <SurfaceCard title="Chamados recentes" subtitle="Últimas solicitações registradas">
        <ListRow
          title="FCH-1024 - Lâmpada queimada"
          subtitle="Bloco B • Sala 203 • Prioridade média"
          badge="Aberto"
          badgeVariant="warning"
          meta="10 min"
          initials="B2"
          accent={colors.orange}
        />
        <ListRow
          title="FCH-1025 - Vazamento no laboratório"
          subtitle="Laboratório 04 • Hidráulica"
          badge="Crítico"
          badgeVariant="danger"
          meta="18 min"
          initials="L4"
          accent={colors.red}
        />
        <ListRow
          title="FCH-1026 - Ar-condicionado"
          subtitle="Administração • Manutenção preventiva"
          badge="Andamento"
          badgeVariant="info"
          meta="1h"
          initials="AD"
          accent={colors.blue}
        />
      </SurfaceCard>

      <View style={styles.split}>
        <SurfaceCard title="Resumo de manutenção" style={styles.splitCard}>
          <View style={styles.ringRow}>
            <RingMetric value="342" label="Concluídas" accent={gridTheme.accent} />
            <View style={styles.progressStack}>
              <ProgressBar value={82} accent={gridTheme.accent} />
              <ProgressBar value={46} accent={colors.orange} />
              <ProgressBar value={28} accent={colors.red} />
            </View>
          </View>
        </SurfaceCard>
        <SurfaceCard title="Tarefas por prioridade" style={styles.splitCard}>
          <MiniBars
            data={[
              { label: 'Baixa', value: 32, color: colors.green },
              { label: 'Média', value: 54, color: colors.blue },
              { label: 'Alta', value: 42, color: colors.orange },
              { label: 'Crítica', value: 23, color: colors.red },
            ]}
          />
        </SurfaceCard>
      </View>

      <SurfaceCard title="Itens com estoque baixo" subtitle="Peças que exigem reposição">
        <ListRow
          title="Lâmpada LED tubular"
          subtitle="12 unidades disponíveis"
          badge="Baixo"
          badgeVariant="warning"
          initials="LE"
          accent={colors.orange}
        />
        <ListRow
          title="Disjuntor bipolar 20A"
          subtitle="5 unidades disponíveis"
          badge="Crítico"
          badgeVariant="danger"
          initials="DJ"
          accent={colors.red}
        />
        <ListRow
          title="Filtro de ar condicionado"
          subtitle="8 unidades disponíveis"
          badge="Baixo"
          badgeVariant="warning"
          initials="FA"
          accent={colors.orange}
        />
      </SurfaceCard>

      <SurfaceCard title="Movimentações recentes" subtitle="Equipe e ordens de serviço">
        <ListRow
          title="Manutenção preventiva concluída"
          subtitle="Oficina de soldagem • Roberto Almeida"
          badge="Concluído"
          badgeVariant="success"
          initials="RA"
          accent={colors.green}
        />
        <ListRow
          title="Inspeção elétrica agendada"
          subtitle="Bloco C • Amanhã às 08:00"
          badge="Agenda"
          badgeVariant="info"
          initials="EL"
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
  split: { gap: 12 },
  splitCard: { flex: 1 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  progressStack: { flex: 1, gap: 13 },
});
