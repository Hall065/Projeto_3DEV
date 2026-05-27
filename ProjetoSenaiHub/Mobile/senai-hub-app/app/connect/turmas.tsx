import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, CalendarDays, GraduationCap, Users } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { PERIODO_OPTIONS, TURMA_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { connectService } from '@/services/connect.service';
import type { Turma } from '@/types/connect.types';

const turmaOptionLoaders = {
  cursos: connectService.listCursoOptions,
  professores: connectService.listProfessorOptions,
};

type TurmaOptionKey = keyof typeof turmaOptionLoaders;
type TurmaOptions = Record<TurmaOptionKey, CrudOption[]>;

function getFields(options: Partial<TurmaOptions>): CrudField[] {
  return [
  { name: 'nome', label: 'Nome da turma', required: true },
  { name: 'curso_id', label: 'Curso', options: options.cursos ?? [], emptyOptionLabel: 'Sem curso' },
  { name: 'professor_responsavel_id', label: 'Professor responsavel', options: options.professores ?? [], emptyOptionLabel: 'Sem professor' },
  { name: 'periodo', label: 'Periodo', required: true, options: PERIODO_OPTIONS },
  { name: 'data_inicio', label: 'Data de início', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'data_termino', label: 'Data de término', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'horario_inicio', label: 'Horário início', placeholder: '08:00', mask: 'time' },
  { name: 'horario_fim', label: 'Horário fim', placeholder: '12:00', mask: 'time' },
  { name: 'status', label: 'Status', required: true, options: TURMA_STATUS_OPTIONS },
  ];
}

function formValues(turma: Turma): Record<string, string> {
  return {
    nome: turma.nome ?? '',
    curso_id: turma.curso_id ?? '',
    professor_responsavel_id: turma.professor_responsavel_id ?? '',
    periodo: turma.periodo ?? 'manha',
    data_inicio: turma.data_inicio ?? '',
    data_termino: turma.data_termino ?? '',
    horario_inicio: turma.horario_inicio ?? '',
    horario_fim: turma.horario_fim ?? '',
    status: turma.status ?? 'ativa',
  };
}

export default function TurmasScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [search, setSearch] = useState('');
  const { options, error: optionsError } = useSelectOptions(turmaOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<Turma, Record<string, string>>({
      load: connectService.listTurmas,
      create: connectService.createTurma,
      update: connectService.updateTurma,
      remove: connectService.deleteTurma,
    });

  const filtered = items.filter((turma) =>
    `${turma.nome} ${turma.curso_nome ?? ''} ${turma.periodo ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Turmas e Cursos"
        description="Gerencie turmas, cursos e vínculos acadêmicos."
        isLoading={loading}
        actionLabel="+ Criar turma"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Turmas ativas" value={items.filter((t) => t.status === 'ativa').length} accent={connectTheme.accent} icon={<Users size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Cursos vinculados" value={new Set(items.map((t) => t.curso_id).filter(Boolean)).size} accent={colors.blue} icon={<BookOpen size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Períodos" value={new Set(items.map((t) => t.periodo).filter(Boolean)).size} accent={colors.orange} icon={<CalendarDays size={16} color={colors.orange} />} style={styles.metric} />
          <MetricTile label="Professores" value={new Set(items.map((t) => t.professor_responsavel_id).filter(Boolean)).size} accent={colors.green} icon={<GraduationCap size={16} color={colors.green} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Pesquisar turma, curso, professor ou período..." value={search} onChangeText={setSearch} />

        <SurfaceCard title="Turmas" subtitle="Turmas ativas e período de aulas">
          {error || optionsError ? <Text style={styles.error}>{error ?? optionsError}</Text> : null}
          {filtered.length === 0 ? <Text style={styles.empty}>Nenhuma turma encontrada.</Text> : null}
          {filtered.map((turma) => (
            <ListRow
              key={turma.id}
              title={turma.nome}
              subtitle={`${turma.curso_nome ?? turma.curso_id ?? 'Curso não vinculado'} • ${turma.periodo ?? 'sem período'}`}
              badge={turma.status}
              badgeVariant={turma.status === 'ativa' ? 'success' : 'neutral'}
              initials={turma.nome.slice(0, 2).toUpperCase()}
              accent={colors.green}
              onEdit={() => {
                setEditing(turma);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(turma.id, turma.nome)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar turma' : 'Nova turma'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { periodo: 'manha', status: 'ativa' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Criar turma'}
        onClose={() => setModalOpen(false)}
        onSubmit={async (values) => {
          if (editing) await updateItem(editing.id, values);
          else await createItem(values);
          setModalOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%' },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 },
});
