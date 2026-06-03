import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalendarCheck, CheckCircle2, Users } from 'lucide-react-native';
import { AppButton, FeedbackMessage, ListRow, LoadingState, MetricTile, Pill, SurfaceCard } from '@/components/common/VisualPrimitives';
import { colors, connectTheme } from '@/constants/colors';
import { connectService } from '@/services/connect.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Aluno, Professor, Turma } from '@/types/connect.types';

type AulaStatus = 'presente' | 'falta_justificada' | 'falta_injustificada';

const STATUS_LABEL: Record<AulaStatus, string> = {
  presente: 'P',
  falta_justificada: 'FJ',
  falta_injustificada: 'FI',
};

export default function FrequenciaScreen() {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [turmaId, setTurmaId] = useState('');
  const [dataAula, setDataAula] = useState(new Date().toISOString().slice(0, 10));
  const [quantidadeAulas, setQuantidadeAulas] = useState(1);
  const [registros, setRegistros] = useState<Record<string, AulaStatus[]>>({});

  useEffect(() => {
    async function load() {
      if (!session?.userId) return;
      setLoading(true);
      setError(null);
      try {
        const professorData = await connectService.getProfessorByUserId(session.userId);
        const turmasData =
          session.perfil?.tipo === 'professor'
            ? await connectService.listTurmasForProfessorUser(session.userId)
            : await connectService.listTurmas();
        setProfessor(professorData);
        setTurmas(turmasData);
        setTurmaId((current) => current || turmasData[0]?.id || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nao foi possivel carregar as turmas.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.perfil?.tipo, session?.userId]);

  useEffect(() => {
    if (!turmaId) {
      setAlunos([]);
      return;
    }
    connectService
      .listAlunosByTurma(turmaId)
      .then((data) => {
        setAlunos(data);
        setRegistros(
          Object.fromEntries(
            data.map((aluno) => [aluno.id, Array.from({ length: quantidadeAulas }, () => 'presente' as AulaStatus)])
          )
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os alunos.'));
  }, [quantidadeAulas, turmaId]);

  const selectedTurma = useMemo(() => turmas.find((turma) => turma.id === turmaId), [turmaId, turmas]);

  const setStatus = (alunoId: string, index: number, status: AulaStatus) => {
    setRegistros((current) => {
      const currentAluno = current[alunoId] ?? Array.from({ length: quantidadeAulas }, () => 'presente' as AulaStatus);
      return {
        ...current,
        [alunoId]: currentAluno.map((item, itemIndex) => (itemIndex === index ? status : item)),
      };
    });
  };

  const save = async () => {
    if (!turmaId) {
      setError('Selecione uma turma.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await connectService.saveChamada({
        turmaId,
        professorId: professor?.id ?? selectedTurma?.professor_responsavel_id,
        dataAula,
        quantidadeAulas,
        registradoPor: session?.userId,
        registros: alunos.map((aluno) => ({
          alunoId: aluno.id,
          aulas: registros[aluno.id] ?? Array.from({ length: quantidadeAulas }, () => 'presente' as AulaStatus),
        })),
      });
      Alert.alert('Chamada', 'Chamada salva com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar a chamada.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metricGrid}>
          <MetricTile label="Turmas disponiveis" value={turmas.length} accent={connectTheme.accent} icon={<Users size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Alunos na chamada" value={alunos.length} accent={colors.blue} icon={<CalendarCheck size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Aulas do dia" value={quantidadeAulas} accent={colors.green} icon={<CheckCircle2 size={16} color={colors.green} />} style={styles.metric} />
        </View>

        <SurfaceCard title="Cabecalho da chamada" subtitle="Selecione turma, data e quantidade de aulas">
          {error ? <FeedbackMessage variant="danger" message={error} /> : null}
          <Text style={styles.label}>Turma</Text>
          <View style={styles.optionGrid}>
            {turmas.map((turma) => (
              <AppButton
                key={turma.id}
                label={turma.nome}
                variant={turma.id === turmaId ? 'primary' : 'secondary'}
                accent={connectTheme.accent}
                onPress={() => setTurmaId(turma.id)}
                wrapperStyle={styles.optionButton}
              />
            ))}
          </View>

          <Text style={styles.label}>Data da aula</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{dataAula}</Text>
            <AppButton label="Hoje" variant="secondary" accent={colors.navy} onPress={() => setDataAula(new Date().toISOString().slice(0, 10))} />
          </View>

          <Text style={styles.label}>Quantidade de aulas</Text>
          <View style={styles.lessonButtons}>
            {[1, 2, 3, 4, 5].map((value) => (
              <AppButton
                key={value}
                label={String(value)}
                variant={quantidadeAulas === value ? 'primary' : 'secondary'}
                accent={colors.red}
                onPress={() => setQuantidadeAulas(value)}
                wrapperStyle={styles.lessonButton}
              />
            ))}
          </View>
          <View style={styles.legend}>
            <Pill label="P = Presente" variant="success" />
            <Pill label="FJ = Justificada" variant="warning" />
            <Pill label="FI = Injustificada" variant="danger" />
          </View>
        </SurfaceCard>

        <SurfaceCard title="Alunos da turma" subtitle="Marque P, FJ ou FI por aula">
          {alunos.length === 0 ? <Text style={styles.empty}>Nenhum aluno encontrado para esta turma.</Text> : null}
          {alunos.map((aluno) => (
            <View key={aluno.id} style={styles.studentRow}>
              <ListRow
                title={aluno.nome}
                subtitle={`RM ${aluno.rm ?? 'sem RM'}`}
                initials={aluno.nome.slice(0, 2).toUpperCase()}
                imageUri={aluno.foto_url}
                accent={connectTheme.accent}
              />
              <View style={styles.attendanceGrid}>
                {Array.from({ length: quantidadeAulas }).map((_, index) => (
                  <View key={`${aluno.id}-${index}`} style={styles.attendanceCell}>
                    <Text style={styles.classIndex}>{index + 1}</Text>
                    {(['presente', 'falta_justificada', 'falta_injustificada'] as AulaStatus[]).map((status) => (
                      <AppButton
                        key={status}
                        label={STATUS_LABEL[status]}
                        variant={(registros[aluno.id]?.[index] ?? 'presente') === status ? 'primary' : 'secondary'}
                        accent={status === 'presente' ? colors.green : status === 'falta_justificada' ? colors.orange : colors.red}
                        onPress={() => setStatus(aluno.id, index, status)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </SurfaceCard>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Salvar chamada" accent={colors.red} onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 96 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  label: { color: colors.navy, fontSize: 12, fontWeight: '900', marginTop: 10, marginBottom: 7 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: { minWidth: '47%' },
  dateBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dateText: { flex: 1, color: colors.navy, fontSize: 14, fontWeight: '900' },
  lessonButtons: { flexDirection: 'row', gap: 8 },
  lessonButton: { flex: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  studentRow: { marginBottom: 12 },
  attendanceGrid: { gap: 8 },
  attendanceCell: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 8,
    gap: 8,
  },
  classIndex: { color: colors.grayText, fontSize: 11, fontWeight: '900' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
