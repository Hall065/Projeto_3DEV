import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Clock3, Wrench } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, Pill, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { CHAMADO_PRIORIDADE_OPTIONS, CHAMADO_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { gridService } from '@/services/grid.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Chamado } from '@/types/grid.types';

const chamadoOptionLoaders = {
  categorias: gridService.listCategoriaOptions,
  blocos: gridService.listBlocoOptions,
  salas: gridService.listSalaOptions,
};

type ChamadoOptionKey = keyof typeof chamadoOptionLoaders;
type ChamadoOptions = Record<ChamadoOptionKey, CrudOption[]>;

function getFields(options: Partial<ChamadoOptions>): CrudField[] {
  return [
  { name: 'titulo', label: 'Título', required: true },
  { name: 'descricao', label: 'Descrição', required: true, multiline: true },
  { name: 'prioridade', label: 'Prioridade', required: true, options: CHAMADO_PRIORIDADE_OPTIONS },
  { name: 'status', label: 'Status', required: true, options: CHAMADO_STATUS_OPTIONS },
  { name: 'categoria_id', label: 'Categoria', options: options.categorias ?? [], emptyOptionLabel: 'Sem categoria' },
  { name: 'bloco_id', label: 'Bloco', options: options.blocos ?? [], emptyOptionLabel: 'Sem bloco' },
  { name: 'sala_id', label: 'Sala', options: options.salas ?? [], emptyOptionLabel: 'Sem sala' },
  ];
}

function formValues(chamado: Chamado): Record<string, string> {
  return {
    titulo: chamado.titulo ?? '',
    descricao: chamado.descricao ?? '',
    prioridade: chamado.prioridade ?? 'media',
    status: chamado.status ?? 'aberto',
    categoria_id: chamado.categoria_id ?? '',
    bloco_id: chamado.bloco_id ?? '',
    sala_id: chamado.sala_id ?? '',
  };
}

export default function ChamadosScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Chamado | null>(null);
  const [search, setSearch] = useState('');
  const session = useAuthStore((s) => s.session);
  const { options, error: optionsError } = useSelectOptions(chamadoOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<Chamado, Record<string, string>>({
      load: gridService.listChamados,
      create: (values) => gridService.createChamado(values, session?.userId),
      update: gridService.updateChamado,
      remove: gridService.deleteChamado,
    });

  const filtered = items.filter((chamado) =>
    `${chamado.codigo ?? ''} ${chamado.titulo} ${chamado.descricao}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Grid"
        title="Chamados"
        description="Abertura, triagem e acompanhamento de solicitações."
        tone="dark"
        isLoading={loading}
        actionLabel="+ Abrir chamado"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Abertos" value={items.filter((c) => c.status === 'aberto').length} accent={gridTheme.accent} tone="dark" icon={<Wrench size={16} color={gridTheme.accent} />} style={styles.metric} />
          <MetricTile label="Alta prioridade" value={items.filter((c) => c.prioridade === 'alta' || c.prioridade === 'urgente').length} accent={colors.red} tone="dark" icon={<AlertCircle size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Em análise" value={items.filter((c) => c.status === 'em_andamento').length} accent={colors.orange} tone="dark" icon={<Clock3 size={16} color={colors.orange} />} style={styles.metric} />
          <MetricTile label="Resolvidos" value={items.filter((c) => c.status === 'concluido').length} accent={colors.green} tone="dark" icon={<CheckCircle2 size={16} color={colors.green} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar por código, sala ou solicitante..." value={search} onChangeText={setSearch} tone="dark" />

        <SurfaceCard tone="dark" title="Fila de chamados" subtitle="Dados carregados do Supabase">
          <View style={styles.filters}>
            <Pill label="Todos" variant="info" tone="dark" />
            <Pill label="Alta" variant="danger" tone="dark" />
            <Pill label="Em andamento" variant="warning" tone="dark" />
            <Pill label="Concluídos" variant="success" tone="dark" />
          </View>
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} tone="dark" /> : null}
          {filtered.length === 0 ? <Text style={styles.emptyDark}>Nenhum chamado encontrado.</Text> : null}
          {filtered.map((chamado) => (
            <ListRow
              key={chamado.id}
              title={`${chamado.codigo ?? 'CH'} - ${chamado.titulo}`}
              subtitle={`${chamado.sala_nome ?? chamado.bloco_nome ?? 'Local não informado'} • ${chamado.prioridade}`}
              badge={chamado.status}
              badgeVariant={chamado.status === 'concluido' ? 'success' : chamado.prioridade === 'urgente' ? 'danger' : 'warning'}
              meta="BD"
              initials="CH"
              accent={chamado.prioridade === 'urgente' ? colors.red : colors.orange}
              tone="dark"
              onEdit={() => {
                setEditing(chamado);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(chamado.id, chamado.titulo)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar chamado' : 'Abrir chamado'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { prioridade: 'media', status: 'aberto' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Abrir chamado'}
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  emptyDark: { color: colors.mutedText, fontSize: 12, fontWeight: '700' },
  error: { color: colors.red, fontSize: 12, fontWeight: '700', marginBottom: 8 },
});
