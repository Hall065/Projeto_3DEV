import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookOpen, CalendarCheck, MapPin, WalletCards } from 'lucide-react-native';
import { ListRow, LoadingState, MetricTile, Pill, RingMetric, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors, connectTheme } from '@/constants/colors';
import { studentService, type StudentDashboardData } from '@/services/student.service';
import { useAuthStore } from '@/stores/auth.store';

export default function AlunoDashboardScreen() {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StudentDashboardData | null>(null);

  useEffect(() => {
    if (!session?.userId) return;
    studentService
      .getDashboard(session.userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [session?.userId]);

  if (loading) return <LoadingState />;

  const aluno = data?.aluno;
  const frequencias = data?.frequencias ?? [];
  const presentes = frequencias.filter((item) => item.status === 'presente').length;
  const frequenciaPerc = frequencias.length ? Math.round((presentes / frequencias.length) * 100) : 0;
  const dentro = Boolean(data?.localizacao?.dentro_do_senai ?? data?.localizacao?.dentro_perimetro);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SurfaceCard title="Meu perfil" subtitle="Dados academicos principais">
        <ListRow
          title={aluno?.nome ?? session?.perfil?.nome ?? 'Aluno'}
          subtitle={`${aluno?.curso_nome ?? 'Curso nao vinculado'} - ${aluno?.turma_nome ?? 'Turma nao vinculada'}`}
          badge={aluno?.status === 'ativo' ? 'Ativo' : aluno?.status ?? 'Sem status'}
          badgeVariant={aluno?.status === 'ativo' ? 'success' : 'neutral'}
          initials={(aluno?.nome ?? session?.perfil?.nome ?? 'AL').slice(0, 2).toUpperCase()}
          imageUri={aluno?.foto_url ?? session?.perfil?.foto_url}
          accent={connectTheme.accent}
        />
        <View style={styles.statusRow}>
          <Pill label={dentro ? 'Dentro do SENAI' : 'Fora do SENAI'} variant={dentro ? 'success' : 'danger'} />
          <Pill label={aluno?.rm ? `RM ${aluno.rm}` : 'RM nao informado'} variant="info" />
        </View>
      </SurfaceCard>

      <View style={styles.metricGrid}>
        <MetricTile label="Frequencia mes" value={`${frequenciaPerc}%`} accent={colors.green} icon={<CalendarCheck size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Faltas injustificadas" value={data?.salario?.faltas_injustificadas ?? 0} accent={colors.red} icon={<BookOpen size={16} color={colors.red} />} style={styles.metric} />
        <MetricTile label="Salario final" value={`R$ ${Math.round(data?.salario?.salario_final ?? 0).toLocaleString('pt-BR')}`} accent={connectTheme.accent} icon={<WalletCards size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="Localizacao" value={dentro ? 'Ativa' : 'Inativa'} accent={dentro ? colors.green : colors.red} icon={<MapPin size={16} color={dentro ? colors.green : colors.red} />} style={styles.metric} />
      </View>

      <SurfaceCard title="Resumo de frequencia" subtitle="Lancamentos deste mes">
        <View style={styles.ringRow}>
          <RingMetric value={`${frequenciaPerc}%`} label="presenca" accent={colors.green} />
          <View style={styles.summary}>
            <Text style={styles.summaryText}>FJ: {frequencias.filter((item) => item.status === 'falta_justificada').length}</Text>
            <Text style={styles.summaryText}>FI: {frequencias.filter((item) => item.status === 'falta_injustificada').length}</Text>
            <Text style={styles.summaryText}>Registros: {frequencias.length}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard title="Aulas recentes" subtitle="Ultimos registros encontrados">
        {frequencias.slice(0, 5).map((item) => (
          <ListRow
            key={item.id}
            title={item.disciplina ?? 'Aula'}
            subtitle={item.data_aula ?? item.data ?? 'Sem data'}
            badge={item.status}
            badgeVariant={item.status === 'presente' ? 'success' : item.status === 'falta_justificada' ? 'warning' : 'danger'}
            initials="FR"
            accent={colors.green}
          />
        ))}
        {frequencias.length === 0 ? <Text style={styles.empty}>Nenhuma frequencia cadastrada.</Text> : null}
      </SurfaceCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 24 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  summary: { flex: 1, gap: 8 },
  summaryText: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
