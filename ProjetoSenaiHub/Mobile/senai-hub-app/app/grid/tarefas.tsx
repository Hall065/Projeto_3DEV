import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Clock3, Plus, Wrench } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { CHAMADO_PRIORIDADE_OPTIONS, TAREFA_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { gridService } from '@/services/grid.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Tarefa } from '@/types/grid.types';

const tarefaOptionLoaders = {
  chamados: gridService.listChamadoOptions,
  responsaveis: gridService.listMaintenanceUsuarioOptions,
};

type TarefaOptionKey = keyof typeof tarefaOptionLoaders;
type TarefaOptions = Record<TarefaOptionKey, CrudOption[]>;

function getFields(options: Partial<TarefaOptions>, limited = false): CrudField[] {
  if (limited) {
    return [
      { name: 'status', label: 'Status', required: true, options: TAREFA_STATUS_OPTIONS },
      { name: 'observacao', label: 'Observação', multiline: true },
    ];
  }

  return [
  { name: 'titulo', label: 'Título da tarefa', required: true },
  { name: 'descricao', label: 'Descrição', multiline: true },
  { name: 'chamado_id', label: 'Chamado existente', options: options.chamados ?? [], emptyOptionLabel: 'Criar chamado novo' },
  { name: 'responsavel_id', label: 'Responsavel', options: options.responsaveis ?? [], emptyOptionLabel: 'Sem responsavel' },
  { name: 'prioridade', label: 'Prioridade', required: true, options: CHAMADO_PRIORIDADE_OPTIONS },
  { name: 'status', label: 'Status', required: true, options: TAREFA_STATUS_OPTIONS },
  { name: 'observacao', label: 'Observação', multiline: true },
  ];
}

function formValues(tarefa: Tarefa): Record<string, string> {
  return {
    titulo: tarefa.titulo ?? '',
    descricao: tarefa.descricao ?? '',
    chamado_id: tarefa.chamado_id ?? '',
    responsavel_id: tarefa.responsavel_id ?? '',
    prioridade: tarefa.prioridade ?? 'media',
    status: tarefa.status ?? 'a_fazer',
    observacao: tarefa.observacao ?? tarefa.observacoes ?? '',
  };
}

function TaskColumn({ title, count, accent, children }: { title: string; count: number; accent: string; children: ReactNode }) {
  return (
    <SurfaceCard tone="dark" style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={[styles.columnDot, { backgroundColor: accent }]} />
        <Text style={styles.columnTitle}>{title}</Text>
        <Text style={styles.columnCount}>{count}</Text>
      </View>
      {children}
    </SurfaceCard>
  );
}

export default function TarefasScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [search, setSearch] = useState('');
  const session = useAuthStore((s) => s.session);
  const isMaintenanceWorker = session?.perfil?.tipo === 'manutencao';
  const { options, error: optionsError } = useSelectOptions(tarefaOptionLoaders);
  const fields = getFields(options, isMaintenanceWorker);
  const loadTarefas = useCallback(async () => {
    const tarefas = await gridService.listTarefas();
    if (!isMaintenanceWorker || !session?.userId) return tarefas;
    return tarefas.filter((tarefa) => tarefa.responsavel_id === session.userId);
  }, [isMaintenanceWorker, session?.userId]);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<Tarefa, Record<string, string>>({
      load: loadTarefas,
      create: (values) => gridService.createTarefa(values, session?.userId),
      update: (id, values) => isMaintenanceWorker ? gridService.updateTarefaStatus(id, values) : gridService.updateTarefa(id, values),
      remove: gridService.deleteTarefa,
    });

  const filtered = items.filter((item) =>
    `${item.titulo} ${item.descricao ?? ''} ${item.chamado_codigo ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const byStatus = {
    a_fazer: filtered.filter((item) => item.status === 'a_fazer'),
    em_andamento: filtered.filter((item) => item.status === 'em_andamento'),
    concluida: filtered.filter((item) => item.status === 'concluida'),
  };

  const renderTask = (task: Tarefa) => (
    <ListRow
      key={task.id}
      title={task.titulo}
      subtitle={`${task.chamado_codigo ?? 'Sem chamado'} • ${task.prioridade}`}
      badge={task.status}
      badgeVariant={task.status === 'concluida' ? 'success' : task.status === 'em_andamento' ? 'info' : 'warning'}
      meta="BD"
      initials="TS"
      accent={task.status === 'concluida' ? gridTheme.accent : colors.orange}
      tone="dark"
      onEdit={() => {
        setEditing(task);
        setModalOpen(true);
      }}
      onDelete={isMaintenanceWorker ? undefined : () => deleteItem(task.id, task.titulo)}
    />
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Grid"
        title="Tarefas"
        description={isMaintenanceWorker ? 'Suas tarefas atribuídas e atualização de status.' : 'Kanban de serviços de manutenção e acompanhamento.'}
        tone="dark"
        isLoading={loading}
        actionLabel={isMaintenanceWorker ? undefined : '+ Adicionar'}
        onActionPress={isMaintenanceWorker ? undefined : () => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="A fazer" value={byStatus.a_fazer.length} accent={colors.blue} tone="dark" icon={<Clock3 size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Em andamento" value={byStatus.em_andamento.length} accent={colors.orange} tone="dark" icon={<Wrench size={16} color={colors.orange} />} style={styles.metric} />
          <MetricTile label="Concluídas" value={byStatus.concluida.length} accent={gridTheme.accent} tone="dark" icon={<CheckCircle2 size={16} color={gridTheme.accent} />} style={styles.metric} />
          <MetricTile label="Total" value={items.length} accent={colors.red} tone="dark" icon={<Plus size={16} color={colors.red} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar tarefa, sala, status ou responsável..." value={search} onChangeText={setSearch} tone="dark" />
        {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} tone="dark" /> : null}

        <TaskColumn title="A fazer" count={byStatus.a_fazer.length} accent={colors.blue}>
          {byStatus.a_fazer.length ? byStatus.a_fazer.map(renderTask) : <Text style={styles.emptyDark}>Sem tarefas.</Text>}
        </TaskColumn>
        <TaskColumn title="Em andamento" count={byStatus.em_andamento.length} accent={colors.orange}>
          {byStatus.em_andamento.length ? byStatus.em_andamento.map(renderTask) : <Text style={styles.emptyDark}>Sem tarefas.</Text>}
        </TaskColumn>
        <TaskColumn title="Concluídas" count={byStatus.concluida.length} accent={gridTheme.accent}>
          {byStatus.concluida.length ? byStatus.concluida.map(renderTask) : <Text style={styles.emptyDark}>Sem tarefas.</Text>}
        </TaskColumn>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar tarefa' : 'Nova tarefa'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { prioridade: 'media', status: 'a_fazer' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Criar tarefa'}
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
  column: { paddingBottom: 6 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  columnDot: { width: 9, height: 9, borderRadius: 5 },
  columnTitle: { flex: 1, color: colors.white, fontSize: 14, fontWeight: '900' },
  columnCount: { color: colors.mutedText, fontSize: 12, fontWeight: '900' },
  emptyDark: { color: colors.mutedText, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 },
});
