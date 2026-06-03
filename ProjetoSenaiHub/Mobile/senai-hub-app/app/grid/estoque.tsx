import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, DollarSign, Package, Warehouse } from 'lucide-react-native';
import { CrudModal, type CrudField, type CrudOption } from '@/components/common/CrudModal';
import { FeedbackMessage, ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { ESTOQUE_STATUS_OPTIONS } from '@/constants/form-options';
import { useCrudResource } from '@/hooks/useCrudResource';
import { useSelectOptions } from '@/hooks/useSelectOptions';
import { gridService } from '@/services/grid.service';
import type { ItemEstoque } from '@/types/grid.types';

const estoqueOptionLoaders = {
  categorias: gridService.listCategoriaOptions,
  fornecedores: gridService.listFornecedorOptions,
};

type EstoqueOptionKey = keyof typeof estoqueOptionLoaders;
type EstoqueOptions = Record<EstoqueOptionKey, CrudOption[]>;

function getFields(options: Partial<EstoqueOptions>): CrudField[] {
  return [
  { name: 'titulo', label: 'Nome do item', required: true },
  { name: 'descricao', label: 'Descrição', multiline: true, required: true },
  { name: 'categoria_id', label: 'Categoria', options: options.categorias ?? [], emptyOptionLabel: 'Sem categoria' },
  { name: 'fornecedor_id', label: 'Fornecedor', options: options.fornecedores ?? [], emptyOptionLabel: 'Sem fornecedor' },
  { name: 'quantidade_disponivel', label: 'Quantidade disponível', keyboardType: 'numeric', mask: 'integer', required: true },
  { name: 'quantidade_minima', label: 'Quantidade mínima', keyboardType: 'numeric', mask: 'integer' },
  { name: 'unidade', label: 'Unidade (ex: un, m, kg)', placeholder: 'un' },
  { name: 'localizacao', label: 'Localização (Sala/Prateleira)', required: true },
  { name: 'empresa_distribuidora', label: 'Distribuidora' },
  { name: 'custo', label: 'Custo', placeholder: '120,00', keyboardType: 'decimal-pad', mask: 'currency' },
  { name: 'status', label: 'Status', required: true, options: ESTOQUE_STATUS_OPTIONS },
  ];
}

function formValues(item: ItemEstoque): Record<string, string> {
  return {
    titulo: item.titulo ?? '',
    descricao: item.descricao ?? '',
    categoria_id: item.categoria_id ?? '',
    fornecedor_id: item.fornecedor_id ?? '',
    quantidade_disponivel: String(item.quantidade_disponivel ?? 0),
    quantidade_minima: String(item.quantidade_minima ?? 0),
    unidade: item.unidade ?? 'un',
    localizacao: item.localizacao ?? '',
    empresa_distribuidora: item.empresa_distribuidora ?? '',
    custo: item.custo ? String(item.custo) : '0',
    status: item.status ?? 'disponivel',
  };
}

export default function EstoqueScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ItemEstoque | null>(null);
  const [search, setSearch] = useState('');
  const { options, error: optionsError } = useSelectOptions(estoqueOptionLoaders);
  const fields = getFields(options);
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<ItemEstoque, Record<string, string>>({
      load: gridService.listEstoque,
      create: gridService.createEstoque,
      update: gridService.updateEstoque,
      remove: gridService.deleteEstoque,
    });

  const filtered = items.filter((item) =>
    `${item.titulo} ${item.descricao ?? ''} ${item.categoria_nome ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalValue = items.reduce((sum, item) => sum + item.quantidade_disponivel * (item.custo ?? 0), 0);

  return (
    <>
      <ModuleScreen
        kicker="SENAI Grid"
        title="Estoque"
        description="Controle de itens, reservas e movimentações."
        isLoading={loading}
        actionLabel="+ Adicionar item"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Total de itens" value={items.length} accent={gridTheme.accent} icon={<Package size={16} color={gridTheme.accent} />} style={styles.metric} />
          <MetricTile label="Valor em estoque" value={`R$ ${Math.round(totalValue).toLocaleString('pt-BR')}`} accent={colors.blue} icon={<DollarSign size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Indisponiveis" value={items.filter((i) => i.status === 'indisponivel').length} accent={colors.red} icon={<AlertTriangle size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Distribuidoras" value={new Set(items.map(i => i.empresa_distribuidora).filter(Boolean)).size} accent={colors.purple} icon={<Warehouse size={16} color={colors.purple} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar por item, código ou categoria..." value={search} onChangeText={setSearch} />

        <SurfaceCard title="Itens cadastrados" subtitle="Lista de materiais de manutenção">
          {error || optionsError ? <FeedbackMessage variant="danger" message={error ?? optionsError ?? ''} /> : null}
          {filtered.length === 0 ? <Text style={styles.empty}>Nenhum item encontrado.</Text> : null}
          {filtered.map((item) => (
            <ListRow
              key={item.id}
              title={item.titulo}
              subtitle={`${item.categoria_nome ?? 'Sem categoria'} • ${item.quantidade_disponivel} ${item.unidade} em ${item.localizacao}`}
              badge={item.status}
              badgeVariant={item.status === 'indisponivel' ? 'danger' : 'success'}
              meta={item.custo ? `R$ ${item.custo.toLocaleString('pt-BR')}` : undefined}
              initials={item.titulo.slice(0, 2).toUpperCase()}
              accent={item.status === 'indisponivel' ? colors.red : colors.green}
              onEdit={() => {
                setEditing(item);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(item.id, item.titulo)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar item' : 'Adicionar item'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { quantidade_disponivel: '0', quantidade_minima: '0', status: 'disponivel' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Salvar item'}
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
