import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BriefcaseBusiness, FileCheck2, FileText } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { CONTRATO_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { connectService } from '@/services/connect.service';
import type { ContratoAluno } from '@/types/connect.types';

const contratoOptionLoaders = {
  alunos: connectService.listAlunoOptions,
  empresas: connectService.listEmpresaOptions,
};

type ContratoOptionKey = keyof typeof contratoOptionLoaders;
type ContratoOptions = Record<ContratoOptionKey, CrudOption[]>;

function getFields(options: Partial<ContratoOptions>): CrudField[] {
  return [
  { name: 'aluno_id', label: 'Aluno', required: true, options: options.alunos ?? [] },
  { name: 'empresa_id', label: 'Empresa', options: options.empresas ?? [], emptyOptionLabel: 'Sem empresa' },
  { name: 'carteira_trabalho', label: 'Carteira de trabalho' },
  { name: 'conta_bancaria', label: 'Conta bancária' },
  { name: 'carga_horaria', label: 'Carga horária', placeholder: '4h, 6h ou 8h', required: true },
  { name: 'localizacao_empresa', label: 'Localização da empresa' },
  { name: 'email_empresa', label: 'E-mail da empresa', keyboardType: 'email-address' },
  { name: 'data_inicio', label: 'Data de início', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'data_termino', label: 'Data de término', placeholder: 'DD/MM/AAAA', mask: 'date' },
  { name: 'status', label: 'Status', required: true, options: CONTRATO_STATUS_OPTIONS },
  ];
}

function formValues(contrato: ContratoAluno): Record<string, string> {
  return {
    aluno_id: contrato.aluno_id ?? '',
    empresa_id: contrato.empresa_id ?? '',
    carteira_trabalho: contrato.carteira_trabalho ?? '',
    conta_bancaria: contrato.conta_bancaria ?? '',
    carga_horaria: contrato.carga_horaria ?? '6h',
    localizacao_empresa: contrato.localizacao_empresa ?? '',
    email_empresa: contrato.email_empresa ?? '',
    data_inicio: contrato.data_inicio ?? '',
    data_termino: contrato.data_termino ?? '',
    status: contrato.status ?? 'ativo',
  };
}

export default function ContratosScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContratoAluno | null>(null);
  const [search, setSearch] = useState('');
  const { options, error: optionsError } = useSelectOptions(contratoOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<ContratoAluno, Record<string, string>>({
      load: connectService.listContratos,
      create: connectService.createContrato,
      update: connectService.updateContrato,
      remove: connectService.deleteContrato,
    });

  const filtered = items.filter((item) =>
    `${item.aluno_nome ?? ''} ${item.empresa_nome ?? ''} ${item.status ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Contratos"
        description="Contratos de aprendizagem vinculados às empresas."
        isLoading={loading}
        actionLabel="+ Novo contrato"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Contratos ativos" value={items.filter((i) => i.status === 'ativo').length} accent={connectTheme.accent} icon={<FileCheck2 size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Empresas parceiras" value={new Set(items.map((i) => i.empresa_id).filter(Boolean)).size} accent={colors.blue} icon={<BriefcaseBusiness size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Pendências" value={items.filter((i) => i.status === 'pendente').length} accent={colors.orange} icon={<FileText size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar contrato, aluno ou empresa..." value={search} onChangeText={setSearch} />

        <SurfaceCard title="Contratos vigentes" subtitle="Contratos de aprendizagem">
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} /> : null}
          {filtered.length === 0 ? <Text style={styles.empty}>Nenhum contrato encontrado.</Text> : null}
          {filtered.map((contrato) => (
            <ListRow
              key={contrato.id}
              title={contrato.empresa_nome ?? contrato.empresa_id ?? 'Empresa não vinculada'}
              subtitle={`${contrato.aluno_nome ?? contrato.aluno_id ?? 'Aluno não vinculado'} • ${contrato.carga_horaria ?? 'carga não informada'}`}
              badge={contrato.status ?? 'ativo'}
              badgeVariant={contrato.status === 'ativo' ? 'success' : contrato.status === 'pendente' ? 'warning' : 'neutral'}
              meta={contrato.data_termino ?? undefined}
              initials="CT"
              accent={colors.green}
              onEdit={() => {
                setEditing(contrato);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(contrato.id, contrato.aluno_nome ?? 'contrato')}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar contrato' : 'Novo contrato'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { carga_horaria: '6h', status: 'ativo' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Salvar contrato'}
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
