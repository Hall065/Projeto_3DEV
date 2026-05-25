import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react-native';
import {
  ListRow,
  MetricTile,
  MiniBars,
  ProgressBar,
  RingMetric,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';

export default function ConnectDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalCursos: 0,
  });

  useEffect(() => {
    connectService
      .getDashboardMetrics()
      .then(setMetrics)
      .catch(() => setMetrics({ totalAlunos: 0, totalProfessores: 0, totalTurmas: 0, totalCursos: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Visão geral"
      description="Dashboard acadêmico do SENAI Connect."
      isLoading={loading}
    >
      <View style={styles.metricGrid}>
        <MetricTile
          label="Alunos ativos"
          value={metrics.totalAlunos || '2.489'}
          hint="+12%"
          accent={connectTheme.accent}
          icon={<Users size={16} color={connectTheme.accent} />}
          style={styles.metric}
        />
        <MetricTile
          label="Professores"
          value={metrics.totalProfessores || 186}
          hint="+8%"
          accent={colors.blue}
          icon={<GraduationCap size={16} color={colors.blue} />}
          style={styles.metric}
        />
        <MetricTile
          label="Turmas"
          value={metrics.totalTurmas || 96}
          hint="Ativas"
          accent={colors.orange}
          icon={<BookOpen size={16} color={colors.orange} />}
          style={styles.metric}
        />
        <MetricTile
          label="Cursos"
          value={metrics.totalCursos || 34}
          hint="+2"
          accent={colors.green}
          icon={<TrendingUp size={16} color={colors.green} />}
          style={styles.metric}
        />
      </View>

      <SurfaceCard title="Frequência média" subtitle="Acompanhamento das turmas no mês">
        <View style={styles.ringRow}>
          <RingMetric value="92,4%" label="Presença" accent={colors.green} />
          <View style={styles.progressStack}>
            <ProgressBar value={92} accent={colors.green} />
            <ProgressBar value={68} accent={colors.blue} />
            <ProgressBar value={22} accent={colors.red} />
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard title="Matrículas por mês" subtitle="Novas entradas e rematrículas">
        <MiniBars
          data={[
            { label: 'Jan', value: 54, color: connectTheme.accent },
            { label: 'Fev', value: 63, color: colors.blue },
            { label: 'Mar', value: 48, color: colors.orange },
            { label: 'Abr', value: 72, color: colors.green },
            { label: 'Mai', value: 86, color: connectTheme.accent },
          ]}
        />
      </SurfaceCard>

      <SurfaceCard title="Atividades recentes" subtitle="Últimos eventos acadêmicos">
        <ListRow
          title="Nova turma criada"
          subtitle="TURMA-AUT-25 • Técnico em Automação"
          badge="Turma"
          badgeVariant="info"
          meta="Hoje"
          initials="TA"
          accent={colors.blue}
        />
        <ListRow
          title="Frequência registrada"
          subtitle="Desenvolvimento de Sistemas • 5 aulas"
          badge="Concluída"
          badgeVariant="success"
          meta="08:40"
          initials="DS"
          accent={colors.green}
        />
        <ListRow
          title="Contrato atualizado"
          subtitle="Empresa parceira • 12 alunos"
          badge="Contrato"
          badgeVariant="warning"
          meta="Ontem"
          initials="CP"
          accent={colors.orange}
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
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  progressStack: { flex: 1, gap: 14 },
});
