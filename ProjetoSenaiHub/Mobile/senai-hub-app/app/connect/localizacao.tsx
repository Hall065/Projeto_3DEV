import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation, Search, Users } from 'lucide-react-native';
import { AppButton, FeedbackMessage, ListRow, LoadingState, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { CampusMap25D } from '@/components/maps/CampusMap25D';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { connectService } from '@/services/connect.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Aluno, LocalizacaoAluno, Turma } from '@/types/connect.types';

type Tab = 'turmas' | 'alunos';

const makeChannelName = (prefix: string, id: string) =>
  `${prefix}-${id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function LocalizacaoScreen() {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('turmas');
  const [search, setSearch] = useState('');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [localizacoes, setLocalizacoes] = useState<LocalizacaoAluno[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const isProfessor = session?.perfil?.tipo === 'professor';
    const turmasData = isProfessor && session?.userId
      ? await connectService.listTurmasForProfessorUser(session.userId)
      : await connectService.listTurmas();
    const alunosData = isProfessor
      ? (await Promise.all(turmasData.map((turma) => connectService.listAlunosByTurma(turma.id)))).flat()
      : await connectService.listAlunos();
    const localizacoesData = await connectService.listLocalizacoes();
    const alunoIds = new Set(alunosData.map((aluno) => aluno.id));
    setTurmas(turmasData);
    setAlunos(alunosData);
    setLocalizacoes(isProfessor ? localizacoesData.filter((item) => alunoIds.has(item.aluno_id)) : localizacoesData);
  }, [session?.perfil?.tipo, session?.userId]);

  useEffect(() => {
    reload()
      .catch((err) => setError(err instanceof Error ? err.message : 'Nao foi possivel carregar localizacoes.'))
      .finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    if (!selectedAlunoId) return undefined;
    const channel = supabase.channel(makeChannelName('connect-localizacao', selectedAlunoId));

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'connect',
        table: 'localizacoes_alunos',
        filter: `aluno_id=eq.${selectedAlunoId}`,
      },
      () => reload().catch(() => undefined)
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload, selectedAlunoId]);

  const locationByAluno = useMemo(
    () => new Map(localizacoes.map((item) => [item.aluno_id, item])),
    [localizacoes]
  );
  const filteredTurmas = turmas.filter((turma) =>
    `${turma.nome} ${turma.curso_nome ?? ''} ${turma.periodo ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAlunos = alunos.filter((aluno) => {
    const inTurma = selectedTurmaId ? aluno.turma_id === selectedTurmaId : true;
    return inTurma && `${aluno.nome} ${aluno.email ?? ''} ${aluno.turma_nome ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });
  const selectedLocation = localizacoes.find((item) => item.aluno_id === selectedAlunoId) ?? null;
  const noCampus = localizacoes.filter((item) => item.dentro_do_senai ?? item.dentro_perimetro).length;

  if (loading) return <LoadingState />;

  return (
    <ModuleScreen
      kicker="SENAI Connect"
      title="Localizacao"
      description="Monitoramento por turma, aluno e geofence."
      isLoading={false}
    >
      <View style={styles.metricGrid}>
        <MetricTile label="Monitorados" value={localizacoes.length} accent={connectTheme.accent} icon={<Users size={16} color={connectTheme.accent} />} style={styles.metric} />
        <MetricTile label="No campus" value={noCampus} accent={colors.green} icon={<Navigation size={16} color={colors.green} />} style={styles.metric} />
        <MetricTile label="Fora" value={Math.max(0, localizacoes.length - noCampus)} accent={colors.red} icon={<MapPin size={16} color={colors.red} />} style={styles.metric} />
      </View>

      {error ? <FeedbackMessage variant="danger" message={error} /> : null}

      <View style={styles.layout}>
        <SurfaceCard title="Lista" subtitle="Turmas e alunos">
          <View style={styles.tabs}>
            <AppButton label="Turmas" variant={tab === 'turmas' ? 'primary' : 'secondary'} accent={connectTheme.accent} onPress={() => setTab('turmas')} wrapperStyle={styles.tab} />
            <AppButton label="Alunos" variant={tab === 'alunos' ? 'primary' : 'secondary'} accent={connectTheme.accent} onPress={() => setTab('alunos')} wrapperStyle={styles.tab} />
          </View>
          <SearchField placeholder="Buscar turmas ou alunos..." value={search} onChangeText={setSearch} />

          <ScrollView style={styles.listPanel} nestedScrollEnabled>
            {tab === 'turmas'
              ? filteredTurmas.map((turma) => (
                  <ListRow
                    key={turma.id}
                    title={turma.nome}
                    subtitle={`${alunos.filter((aluno) => aluno.turma_id === turma.id).length} alunos vinculados - ${turma.curso_nome ?? 'Curso não vinculado'}`}
                    badge={selectedTurmaId === turma.id ? 'Selecionada' : turma.status}
                    badgeVariant={selectedTurmaId === turma.id ? 'info' : turma.status === 'ativa' ? 'success' : 'neutral'}
                    initials={turma.nome.slice(0, 2).toUpperCase()}
                    accent={colors.blue}
                    onPress={() => {
                      setSelectedTurmaId((current) => (current === turma.id ? null : turma.id));
                      setTab('alunos');
                    }}
                  />
                ))
              : filteredAlunos.map((aluno) => {
                  const loc = locationByAluno.get(aluno.id);
                  const inside = Boolean(loc?.dentro_do_senai ?? loc?.dentro_perimetro);
                  return (
                    <View key={aluno.id} style={styles.alunoBlock}>
                      <ListRow
                        title={aluno.nome}
                        subtitle={`${aluno.email_institucional ?? aluno.email ?? 'Sem e-mail'} - ${loc?.em_aula ? 'Em aula' : 'Fora de aula'}`}
                        badge={inside ? 'Dentro' : 'Fora'}
                        badgeVariant={inside ? 'success' : 'danger'}
                        initials={aluno.nome.slice(0, 2).toUpperCase()}
                        imageUri={aluno.foto_url}
                        accent={inside ? colors.green : colors.red}
                      />
                      <AppButton
                        label="Ver localizacao"
                        variant="secondary"
                        accent={inside ? connectTheme.accent : colors.grayText}
                        icon={<Search size={15} color={inside ? connectTheme.accent : colors.grayText} />}
                        disabled={!inside}
                        onPress={() => setSelectedAlunoId(aluno.id)}
                      />
                    </View>
                  );
                })}
          </ScrollView>
        </SurfaceCard>

        <SurfaceCard title="Mapa 2.5D do campus" subtitle="Pin atualizado por Realtime">
          <CampusMap25D
            locations={selectedLocation ? [selectedLocation] : localizacoes}
            selectedId={selectedAlunoId}
            onSelect={(item) => setSelectedAlunoId(item.aluno_id)}
          />
          {selectedLocation ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{selectedLocation.aluno_nome ?? selectedLocation.aluno_id}</Text>
              <Text style={styles.infoText}>{selectedLocation.turma_nome ?? 'Turma nao vinculada'}</Text>
              <Text style={styles.infoText}>
                {selectedLocation.dentro_do_senai ?? selectedLocation.dentro_perimetro ? 'Dentro do perimetro' : 'Fora do perimetro'}
              </Text>
            </View>
          ) : (
            <Text style={styles.empty}>Selecione um aluno dentro do perimetro para acompanhar.</Text>
          )}
        </SurfaceCard>
      </View>
    </ModuleScreen>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  layout: { gap: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tab: { flex: 1 },
  listPanel: { maxHeight: 440 },
  alunoBlock: { marginBottom: 10 },
  infoCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 12,
  },
  infoTitle: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  infoText: { color: colors.grayText, fontSize: 12, fontWeight: '700', marginTop: 4 },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
});
