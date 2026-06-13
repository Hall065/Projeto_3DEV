import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, BriefcaseBusiness, CalendarCheck, CircleDollarSign, FileText, GraduationCap, Users } from 'lucide-react-native';
import {
  AppButton,
  FeedbackMessage,
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
import { useEmpresaContext } from '@/hooks/useEmpresaContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getEmpresaDashboardMetrics, listContratosByEmpresaId } from '@/services/empresa.service';
import { connectService } from '@/services/connect.service';
import type { ContratoAluno, Curso, Turma } from '@/types/connect.types';

export default function ConnectDashboard() {
  const router = useRouter();
  const theme = useThemeColors();
  const themedTone = theme.isDark ? 'dark' : 'light';
  const { isEmpresa, empresa, empresaId, loading: empresaLoading } = useEmpresaContext();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAlunos: 0,
    totalProfessores: 0,
    totalTurmas: 0,
    totalCursos: 0,
  });
  const [empresaMetrics, setEmpresaMetrics] = useState({
    totalContratos: 0,
    contratosAtivos: 0,
    totalAlunos: 0,
    totalFrequencias: 0,
    totalSalarios: 0,
  });
  const [contratos, setContratos] = useState<ContratoAluno[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (isEmpresa && empresaId) {
          const [dashboardMetrics, contratosData] = await Promise.all([
            getEmpresaDashboardMetrics(empresaId),
            listContratosByEmpresaId(empresaId),
          ]);
          setEmpresaMetrics(dashboardMetrics);
          setContratos(contratosData);
          return;
        }

        const [dashboardMetrics, cursosData, turmasData] = await Promise.all([
          connectService.getDashboardMetrics(),
          connectService.listCursos(),
          connectService.listTurmas(),
        ]);
        setMetrics(dashboardMetrics);
        setCursos(cursosData);
        setTurmas(turmasData);
      } catch {
        setMetrics({ totalAlunos: 0, totalProfessores: 0, totalTurmas: 0, totalCursos: 0 });
        setEmpresaMetrics({
          totalContratos: 0,
          contratosAtivos: 0,
          totalAlunos: 0,
          totalFrequencias: 0,
          totalSalarios: 0,
        });
        setContratos([]);
        setCursos([]);
        setTurmas([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId, isEmpresa]);

  const screenLoading = loading || (isEmpresa && empresaLoading);

  const cursosPorPeriodo = [
    { label: 'Manhã', value: cursos.filter((c) => c.periodo === 'manha').length, color: colors.blue },
    { label: 'Tarde', value: cursos.filter((c) => c.periodo === 'tarde').length, color: connectTheme.accent },
    { label: 'Noite', value: cursos.filter((c) => c.periodo === 'noite').length, color: colors.orange },
    { label: 'Integral', value: cursos.filter((c) => c.periodo === 'integral').length, color: colors.green },
  ];

  if (isEmpresa) {
    return (
      <ModuleScreen
        kicker="SENAI Connect"
        title="Portal da empresa"
        description={`Acompanhe contratos, frequência e salários dos aprendizes de ${empresa?.nome ?? 'sua empresa'}.`}
        isLoading={screenLoading}
      >
        {isEmpresa && !empresa && !screenLoading ? (
          <FeedbackMessage
            variant="warning"
            message="Não foi possível identificar a empresa vinculada ao seu usuário. Verifique se o e-mail de login corresponde ao cadastro da empresa."
          />
        ) : null}

        <SurfaceCard tone={themedTone} title={empresa?.nome ?? 'Empresa parceira'} subtitle="Resumo dos aprendizes vinculados">
          <View style={styles.heroContent}>
            <RingMetric value={empresaMetrics.totalAlunos} label="aprendizes" accent={connectTheme.accent} tone={themedTone} />
            <View style={styles.heroBody}>
              <Text style={[styles.heroTitle, { color: theme.text }]}>Gestão dos seus contratos</Text>
              <Text style={[styles.heroText, { color: theme.textMuted }]}>
                Consulte contratos, frequência e cálculo salarial apenas dos alunos vinculados à sua empresa.
              </Text>
              <View style={styles.heroPills}>
                <Pill label={`${empresaMetrics.contratosAtivos} contratos ativos`} variant="info" tone={themedTone} />
                <Pill label={`${empresaMetrics.totalFrequencias} registros`} variant="success" tone={themedTone} />
              </View>
            </View>
          </View>
        </SurfaceCard>

        <View style={styles.metricGrid}>
          <MetricTile label="Contratos" value={empresaMetrics.totalContratos} accent={connectTheme.accent} icon={<FileText size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Aprendizes" value={empresaMetrics.totalAlunos} accent={colors.blue} icon={<Users size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Frequência" value={empresaMetrics.totalFrequencias} accent={colors.orange} icon={<CalendarCheck size={16} color={colors.orange} />} style={styles.metric} />
          <MetricTile label="Cálculos" value={empresaMetrics.totalSalarios} accent={colors.green} icon={<CircleDollarSign size={16} color={colors.green} />} style={styles.metric} />
        </View>

        <SurfaceCard title="Atalhos rápidos" subtitle="Áreas liberadas para o perfil empresa">
          <View style={styles.quickGrid}>
            <AppButton
              label="Contratos"
              variant="secondary"
              accent={connectTheme.accent}
              icon={<FileText size={16} color={connectTheme.accent} />}
              onPress={() => router.push(ROUTES.connect.contratos as never)}
              wrapperStyle={styles.quickButton}
            />
            <AppButton
              label="Frequência"
              variant="secondary"
              accent={colors.blue}
              icon={<CalendarCheck size={16} color={colors.blue} />}
              onPress={() => router.push(ROUTES.connect.gerenciarFrequencia as never)}
              wrapperStyle={styles.quickButton}
            />
            <AppButton
              label="Salário"
              variant="secondary"
              accent={colors.green}
              icon={<CircleDollarSign size={16} color={colors.green} />}
              onPress={() => router.push(ROUTES.connect.salario as never)}
              wrapperStyle={styles.quickButton}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard title="Contratos recentes" subtitle="Aprendizes vinculados à empresa">
          {contratos.length === 0 ? <Text style={styles.empty}>Nenhum contrato encontrado.</Text> : null}
          {contratos.slice(0, 5).map((contrato) => (
            <ListRow
              key={contrato.id}
              title={contrato.aluno_nome ?? contrato.aluno_id ?? 'Aluno'}
              subtitle={`${contrato.carga_horaria ?? 'carga não informada'} • ${contrato.status ?? 'ativo'}`}
              badge={contrato.status ?? 'ativo'}
              badgeVariant={contrato.status === 'ativo' ? 'success' : 'neutral'}
              initials="CT"
              accent={colors.blue}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>
    );
  }

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Visão geral"
      description="Dashboard acadêmico do SENAI Connect."
      isLoading={screenLoading}
    >
      <SurfaceCard tone={themedTone} title="Operação acadêmica" subtitle="Resumo carregado do Supabase">
        <View style={styles.heroContent}>
          <RingMetric value={metrics.totalAlunos} label="alunos ativos" accent={connectTheme.accent} tone={themedTone} />
          <View style={styles.heroBody}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Acompanhamento centralizado</Text>
            <Text style={[styles.heroText, { color: theme.textMuted }]}>
              Cursos, turmas, professores e frequência reunidos para consulta rápida.
            </Text>
            <View style={styles.heroPills}>
              <Pill label={`${metrics.totalTurmas} turmas`} variant="info" tone={themedTone} />
              <Pill label={`${metrics.totalCursos} cursos`} variant="success" tone={themedTone} />
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
  heroTitle: { fontSize: 16, fontWeight: '900' },
  heroText: { fontSize: 12, lineHeight: 17, marginTop: 5 },
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
