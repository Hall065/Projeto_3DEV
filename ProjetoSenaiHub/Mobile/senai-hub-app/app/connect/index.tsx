import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, BriefcaseBusiness, GraduationCap, Users } from 'lucide-react-native';
import { ListRow, MetricTile, MiniBars, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';
import type { Curso, Turma } from '@/types/connect.types';

export default function ConnectDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalCursos: 0,
  });
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    Promise.all([
      connectService.getDashboardMetrics(),
      connectService.listCursos(),
      connectService.listTurmas(),
    ])
      .then(([dashboardMetrics, cursosData, turmasData]) => {
        setMetrics(dashboardMetrics);
        setCursos(cursosData);
        setTurmas(turmasData);
      })
      .catch(() => {
        setMetrics({ totalAlunos: 0, totalProfessores: 0, totalTurmas: 0, totalCursos: 0 });
        setCursos([]);
        setTurmas([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const cursosPorPeriodo = [
    { label: 'Manha', value: cursos.filter((c) => c.periodo === 'manha').length, color: colors.blue },
    { label: 'Tarde', value: cursos.filter((c) => c.periodo === 'tarde').length, color: connectTheme.accent },
    { label: 'Noite', value: cursos.filter((c) => c.periodo === 'noite').length, color: colors.orange },
    { label: 'Integral', value: cursos.filter((c) => c.periodo === 'integral').length, color: colors.green },
  ];

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Visao geral"
      description="Dashboard academico do SENAI Connect."
      isLoading={loading}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="Alunos ativos" value={metrics.totalAlunos} accent={connectTheme.accent} icon={<Users size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="Professores" value={metrics.totalProfessores} accent={colors.blue} icon={<GraduationCap size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Turmas" value={metrics.totalTurmas} accent={colors.orange} icon={<BookOpen size={16} color={colors.orange} />} style={styles.metric} />
        <MetricTile label="Cursos" value={metrics.totalCursos} accent={colors.green} icon={<BriefcaseBusiness size={16} color={colors.green} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Cursos por periodo" subtitle="Distribuicao real do catalogo">
        {cursos.length === 0 ? (
          <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text>
        ) : (
          <MiniBars data={cursosPorPeriodo} />
        )}
      </SurfaceCard>

      <SurfaceCard title="Turmas cadastradas" subtitle="Ultimas turmas carregadas do Supabase">
        {turmas.length === 0 ? <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text> : null}
        {turmas.slice(0, 5).map((turma) => (
          <ListRow
            key={turma.id}
            title={turma.nome}
            subtitle={`${turma.curso_nome ?? 'Curso nao vinculado'} - ${turma.periodo ?? 'sem periodo'}`}
            badge={turma.status}
            badgeVariant={turma.status === 'ativa' ? 'success' : 'neutral'}
            initials={turma.nome.slice(0, 2).toUpperCase()}
            accent={colors.blue}
          />
        ))}
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
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
