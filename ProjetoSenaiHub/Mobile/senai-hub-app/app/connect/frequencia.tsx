import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarCheck, CheckCircle2, Clock3, XCircle } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, Pill, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { FREQUENCIA_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { connectService } from '@/services/connect.service';
import { useAuthStore } from '@/stores/auth.store';
import type { FrequenciaRegistro } from '@/types/connect.types';

const frequenciaOptionLoaders = {
  alunos: connectService.listAlunoOptions,
  turmas: connectService.listTurmaOptions,
  professores: connectService.listProfessorOptions,
};

type FrequenciaOptionKey = keyof typeof frequenciaOptionLoaders;
type FrequenciaOptions = Record<FrequenciaOptionKey, CrudOption[]>;

function getFields(options: Partial<FrequenciaOptions>): CrudField[] {
  return [
  { name: 'aluno_id', label: 'Aluno', required: true, options: options.alunos ?? [] },
  { name: 'turma_id', label: 'Turma', options: options.turmas ?? [], emptyOptionLabel: 'Sem turma' },
  { name: 'professor_id', label: 'Professor', options: options.professores ?? [], emptyOptionLabel: 'Sem professor' },
  { name: 'disciplina', label: 'Disciplina' },
  { name: 'data_aula', label: 'Data da aula', placeholder: 'DD/MM/AAAA', mask: 'date', required: true },
  { name: 'quantidade_aulas', label: 'Quantidade de aulas', keyboardType: 'numeric', mask: 'integer' },
  { name: 'status', label: 'Status', required: true, options: FREQUENCIA_STATUS_OPTIONS },
  { name: 'quantidade_aulas_faltadas', label: 'Aulas faltadas', keyboardType: 'numeric', mask: 'integer' },
  { name: 'justificativa', label: 'Justificativa', multiline: true },
  ];
}

function formValues(frequencia: FrequenciaRegistro): Record<string, string> {
  return {
    aluno_id: frequencia.aluno_id ?? '',
    data_aula: frequencia.data_aula ?? frequencia.data ?? '',
    status: frequencia.status ?? 'presente',
    quantidade_aulas_faltadas: frequencia.quantidade_aulas_faltadas ? String(frequencia.quantidade_aulas_faltadas) : '0',
  };
}

export default function FrequenciaScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FrequenciaRegistro | null>(null);
  const session = useAuthStore((s) => s.session);
  const { options, error: optionsError } = useSelectOptions(frequenciaOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<FrequenciaRegistro, Record<string, string>>({
      load: connectService.listFrequencias,
      create: (values) => connectService.createFrequencia(values, session?.userId),
      update: connectService.updateFrequencia,
      remove: connectService.deleteFrequencia,
    });

  const presentes = items.filter((item) => item.status === 'presente').length;
  const faltas = items.filter((item) => item.status !== 'presente').length;
  const presenceRate = items.length ? Math.round((presentes / items.length) * 100) : 0;

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Frequência"
        description="Registro de presença por turma e aula."
        isLoading={loading}
        actionLabel="+ Registrar"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Presentes" value={`${presenceRate}%`} accent={colors.green} icon={<CheckCircle2 size={16} color={colors.green} />} style={styles.metric} />
          <MetricTile label="Faltas" value={faltas} accent={colors.red} icon={<XCircle size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Registros" value={items.length} accent={connectTheme.accent} icon={<CalendarCheck size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Pendentes" value={items.filter((i) => !i.status).length} accent={colors.orange} icon={<Clock3 size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SurfaceCard title="Registros de frequência" subtitle="Dados carregados do Supabase">
          <View style={styles.tabs}>
            <Pill label="Presença" variant="success" />
            <Pill label="Falta justificada" variant="warning" />
            <Pill label="Falta" variant="danger" />
          </View>
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} /> : null}
          {items.length === 0 ? <Text style={styles.empty}>Nenhum registro de frequência encontrado.</Text> : null}
          {items.map((registro) => (
            <ListRow
              key={registro.id}
              title={registro.aluno_nome ?? registro.aluno_id}
              subtitle={`${registro.turma_nome ?? 'Turma não vinculada'} • ${registro.data_aula ?? registro.data ?? 'sem data'}`}
              badge={registro.status}
              badgeVariant={registro.status === 'presente' ? 'success' : registro.status === 'falta_justificada' ? 'warning' : 'danger'}
              meta={registro.quantidade_aulas_faltadas ? `${registro.quantidade_aulas_faltadas} aulas` : undefined}
              initials="FR"
              accent={registro.status === 'presente' ? colors.green : colors.red}
              onEdit={() => {
                setEditing(registro);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(registro.id, registro.aluno_nome ?? 'frequência')}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar frequência' : 'Registrar frequência'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { status: 'presente', quantidade_aulas: '1', quantidade_aulas_faltadas: '0', data_aula: new Date().toISOString().slice(0, 10) }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Registrar'}
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
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  empty: { color: colors.grayText, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 },
});
