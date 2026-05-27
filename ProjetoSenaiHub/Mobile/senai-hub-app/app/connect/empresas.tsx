import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BriefcaseBusiness, Building2, Mail, UserCheck } from 'lucide-react-native';
import { CrudModal, type CrudField } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, connectTheme } from '@/constants/colors';
import { EMPRESA_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { connectService } from '@/services/connect.service';
import type { Empresa } from '@/types/connect.types';

const fields: CrudField[] = [
  { name: 'nome', label: 'Nome da empresa', required: true },
  { name: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', mask: 'cnpj' },
  { name: 'email', label: 'E-mail', keyboardType: 'email-address' },
  { name: 'telefone', label: 'Telefone', placeholder: '(19) 99999-9999', mask: 'phone' },
  { name: 'responsavel_nome', label: 'Responsavel' },
  { name: 'status', label: 'Status', required: true, options: EMPRESA_STATUS_OPTIONS },
];

function formValues(empresa: Empresa): Record<string, string> {
  return {
    nome: empresa.nome ?? '',
    cnpj: empresa.cnpj ?? '',
    email: empresa.email ?? '',
    telefone: empresa.telefone ?? '',
    responsavel_nome: empresa.responsavel_nome ?? '',
    status: empresa.status ?? 'ativa',
  };
}

export default function EmpresasScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [search, setSearch] = useState('');
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<Empresa, Record<string, string>>({
      load: connectService.listEmpresas,
      create: connectService.createEmpresa,
      update: connectService.updateEmpresa,
      remove: connectService.deleteEmpresa,
    });

  const filtered = items.filter((empresa) =>
    `${empresa.nome} ${empresa.cnpj ?? ''} ${empresa.responsavel_nome ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Connect"
        title="Empresas"
        description="Cadastro das empresas parceiras dos contratos de aprendizagem."
        isLoading={loading}
        actionLabel="+ Nova empresa"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Empresas" value={items.length} accent={connectTheme.accent} icon={<Building2 size={16} color={connectTheme.accent} />} style={styles.metric} />
          <MetricTile label="Ativas" value={items.filter((e) => e.status === 'ativa').length} accent={colors.green} icon={<UserCheck size={16} color={colors.green} />} style={styles.metric} />
          <MetricTile label="Com e-mail" value={items.filter((e) => e.email).length} accent={colors.blue} icon={<Mail size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Parceiras" value={new Set(items.map((e) => e.cnpj ?? e.nome)).size} accent={colors.orange} icon={<BriefcaseBusiness size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar empresa, CNPJ ou responsavel..." value={search} onChangeText={setSearch} />

        <SurfaceCard title="Empresas cadastradas" subtitle="Dados usados nos contratos">
          {error ? <FeedbackMessage variant="danger" message={error} /> : null}
          {filtered.length === 0 ? <Text style={styles.empty}>Nenhuma empresa encontrada.</Text> : null}
          {filtered.map((empresa) => (
            <ListRow
              key={empresa.id}
              title={empresa.nome}
              subtitle={`${empresa.cnpj ?? 'CNPJ nao informado'} - ${empresa.responsavel_nome ?? 'Sem responsavel'}`}
              badge={empresa.status ?? 'ativa'}
              badgeVariant={empresa.status === 'ativa' ? 'success' : 'neutral'}
              meta={empresa.email ?? undefined}
              initials={empresa.nome.slice(0, 2).toUpperCase()}
              accent={colors.blue}
              onEdit={() => {
                setEditing(empresa);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(empresa.id, empresa.nome)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar empresa' : 'Nova empresa'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { status: 'ativa' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alteracoes' : 'Criar empresa'}
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
