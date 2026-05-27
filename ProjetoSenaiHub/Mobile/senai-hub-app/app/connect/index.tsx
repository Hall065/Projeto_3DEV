import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, BriefcaseBusiness, CalendarCheck, GraduationCap, Users } from 'lucide-react-native';
import {
  AppButton,
  ListRow,
  MetricTile,
  MiniBars,
  Pill,
  RingMetric,
  SurfaceCard,
} from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { ROUTES } from '@/constants/routes';
import { connectService } from '@/services/connect.service';
import type { Curso, Turma } from '@/types/connect.types';

export default function ConnectDashboard() {
  const router = useRouter();
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
    { label: 'Manhã', value: cursos.filter((c) => c.periodo === 'manha').length, color: colors.blue },
    { label: 'Tarde', value: cursos.filter((c) => c.periodo === 'tarde').length, color: connectTheme.accent },
    { label: 'Noite', value: cursos.filter((c) => c.periodo === 'noite').length, color: colors.orange },
    { label: 'Integral', value: cursos.filter((c) => c.periodo === 'integral').length, color: colors.green },
  ];

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Visão geral"
      description="Dashboard acadêmico do SENAI Connect."
      isLoading={loading}
    >
      <SurfaceCard tone="dark" title="Operação acadêmica" subtitle="Resumo carregado do Supabase">
        <View style={styles.heroContent}>
          <RingMetric value={metrics.totalAlunos} label="alunos ativos" accent={connectTheme.accent} tone="dark" />
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Acompanhamento centralizado</Text>
            <Text style={styles.heroText}>
              Cursos, turmas, professores e frequência reunidos para consulta rápida.
            </Text>
            <View style={styles.heroPills}>
              <Pill label={`${metrics.totalTurmas} turmas`} variant="info" tone="dark" />
              <Pill label={`${metrics.totalCursos} cursos`} variant="success" tone="dark" />
            </View>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.metricGrid}>
        <MetricTile label="Alunos ativos" value={metrics.totalAlunos} accent={connectTheme.accent} icon={<Users size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="Professores" value={metrics.totalProfessores} accent={colors.blue} icon={<GraduationCap size={16} color={colors.blue} />} style={styles.metric} />
        <MetricTile label="Turmas" value={metrics.totalTurmas} accent={colors.orange} icon={<BookOpen size={16} color={colors.orange} />} style={styles.metric} />
        <MetricTile label="Cursos" value={metrics.totalCursos} accent={colors.green} icon={<BriefcaseBusiness size={16} color={colors.green} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Atalhos rápidos" subtitle="Ações usadas na rotina acadêmica">
        <View style={styles.quickGrid}>
          <AppButton
            label="Alunos"
            variant="secondary"
            accent={connectTheme.accent}
            icon={<Users size={16} color={connectTheme.accent} />}
            onPress={() => router.push(ROUTES.connect.alunos as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Turmas"
            variant="secondary"
            accent={colors.blue}
            icon={<GraduationCap size={16} color={colors.blue} />}
            onPress={() => router.push(ROUTES.connect.turmas as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Frequência"
            variant="secondary"
            accent={colors.orange}
            icon={<CalendarCheck size={16} color={colors.orange} />}
            onPress={() => router.push(ROUTES.connect.frequencia as never)}
            wrapperStyle={styles.quickButton}
          />
          <AppButton
            label="Cursos"
            variant="secondary"
            accent={colors.green}
            icon={<BookOpen size={16} color={colors.green} />}
            onPress={() => router.push(ROUTES.connect.cursos as never)}
            wrapperStyle={styles.quickButton}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard title="Cursos por período" subtitle="Distribuição real do catálogo">
        {cursos.length === 0 ? (
          <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text>
        ) : (
          <MiniBars data={cursosPorPeriodo} />
        )}
      </SurfaceCard>

      <SurfaceCard title="Turmas cadastradas" subtitle="Últimas turmas carregadas do Supabase">
        {turmas.length === 0 ? <Text style={styles.empty}>Nenhum dado cadastrado ainda.</Text> : null}
        {turmas.slice(0, 5).map((turma) => (
          <ListRow
            key={turma.id}
            title={turma.nome}
            subtitle={`${turma.curso_nome ?? 'Curso não vinculado'} - ${turma.periodo ?? 'sem período'}`}
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
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroBody: { flex: 1, minWidth: 0 },
  heroTitle: { color: colors.white, fontSize: 16, fontWeight: '900' },
  heroText: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 5 },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: { width: '48%' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: { width: '48%' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
