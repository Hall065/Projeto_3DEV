import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, Clock3, Layers } from 'lucide-react-native';
import { CrudModal, type CrudField } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, MiniBars, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { CURSO_MODALIDADE_OPTIONS, PERIODO_OPTIONS, USER_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { connectService } from '@/services/connect.service';
import type { Curso } from '@/types/connect.types';

const fields: CrudField[] = [
  { name: 'nome', label: 'Nome do curso', required: true },
  { name: 'descricao', label: 'Descrição', multiline: true },
  { name: 'modalidade', label: 'Modalidade', required: true, options: CURSO_MODALIDADE_OPTIONS },
  { name: 'periodo', label: 'Periodo', required: true, options: PERIODO_OPTIONS },
  { name: 'carga_horaria', label: 'Carga horária', keyboardType: 'numeric', mask: 'integer' },
  { name: 'data_inicio', label: 'Data de início', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'data_termino', label: 'Data de término', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'status', label: 'Status', required: true, options: USER_STATUS_OPTIONS },
];

function formValues(curso: Curso): Record<string, string> {
  return {
    nome: curso.nome ?? '',
    descricao: curso.descricao ?? '',
    modalidade: curso.modalidade ?? 'tecnico',
    periodo: curso.periodo ?? 'manha',
    carga_horaria: curso.carga_horaria ? String(curso.carga_horaria) : '',
    data_inicio: curso.data_inicio ?? '',
    data_termino: curso.data_termino ?? '',
    status: curso.status ?? 'ativo',
  };
}

export default function CursosScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<Curso, Record<string, string>>({
      load: connectService.listCursos,
      create: connectService.createCurso,
      update: connectService.updateCurso,
      remove: connectService.deleteCurso,
    });

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Cursos"
        description="Catálogo de cursos, carga horária e turmas vinculadas."
        isLoading={loading}
        actionLabel="+ Novo curso"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Cursos ativos" value={items.filter((c) => c.status === 'ativo').length} accent={connectTheme.accent} icon={<BookOpen size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Períodos" value={new Set(items.map((c) => c.periodo).filter(Boolean)).size} accent={colors.blue} icon={<Layers size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Carga média" value={items.length ? Math.round(items.reduce((sum, c) => sum + (c.carga_horaria ?? 0), 0) / items.length) : 0} accent={colors.orange} icon={<Clock3 size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SurfaceCard title="Cursos por período" subtitle="Distribuição do catálogo atual">
          <MiniBars
            data={[
              { label: 'Manhã', value: items.filter((c) => c.periodo === 'manha').length, color: colors.blue },
              { label: 'Tarde', value: items.filter((c) => c.periodo === 'tarde').length, color: connectTheme.accent },
              { label: 'Noite', value: items.filter((c) => c.periodo === 'noite').length, color: colors.orange },
              { label: 'Integral', value: items.filter((c) => c.periodo === 'integral').length, color: colors.green },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard title="Catálogo" subtitle="Cursos cadastrados">
          {error ? <FeedbackMessage variant="danger" message={error} /> : null}
          {items.length === 0 ? <Text style={styles.empty}>Nenhum curso encontrado.</Text> : null}
          {items.map((curso) => (
            <ListRow
              key={curso.id}
              title={curso.nome}
              subtitle={`${curso.periodo ?? 'período não informado'} • ${curso.carga_horaria ?? 0}h`}
              badge={curso.status}
              badgeVariant={curso.status === 'ativo' ? 'success' : 'neutral'}
              initials={curso.nome.slice(0, 2).toUpperCase()}
              accent={colors.blue}
              onEdit={() => {
                setEditing(curso);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(curso.id, curso.nome)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar curso' : 'Novo curso'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { modalidade: 'tecnico', periodo: 'manha', status: 'ativo' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Criar curso'}
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
