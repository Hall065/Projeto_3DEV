import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react-native';
import { CrudModal, type CrudField } from '@/components/common/CrudModal';
import { ListRow, MetricTile, SearchField, SurfaceCard } from '@/components/common/VisualPrimitives';
import { ModuleScreen } from '@/components/screens/ModuleScreen';
import { colors, gridTheme } from '@/constants/colors';
import { useCrudResource } from '@/hooks/useCrudResource';
import { gridService } from '@/services/grid.service';
import type { HubUsuario } from '@/types/auth.types';

const fields: CrudField[] = [
  { name: 'nome', label: 'Nome completo', required: true },
  { name: 'email_institucional', label: 'E-mail institucional', required: true, keyboardType: 'email-address' },
  { name: 'senha', label: 'Senha inicial', placeholder: 'Senai@123456', secureTextEntry: true },
  { name: 'tipo', label: 'Perfil', placeholder: 'manutencao, admin, direcao...' },
  { name: 'telefone', label: 'Telefone', placeholder: '(19) 98999-9999', mask: 'phone' },
  { name: 'cpf', label: 'CPF', placeholder: '111.111.111-11', mask: 'cpf' },
  { name: 'status', label: 'Status', placeholder: 'ativo' },
];

function initials(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formValues(usuario: HubUsuario): Record<string, string> {
  return {
    nome: usuario.nome ?? '',
    email_institucional: usuario.email_institucional ?? '',
    senha: '',
    tipo: usuario.tipo ?? 'manutencao',
    telefone: usuario.telefone ?? '',
    cpf: usuario.cpf ?? '',
    status: usuario.status ?? 'ativo',
  };
}

export default function UsuariosGridScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HubUsuario | null>(null);
  const [search, setSearch] = useState('');
  const { items, loading, submitting, error, createItem, updateItem, deleteItem } =
    useCrudResource<HubUsuario, Record<string, string>>({
      load: gridService.listUsuarios,
      create: gridService.createUsuario,
      update: gridService.updateUsuario,
      remove: gridService.deleteUsuario,
    });

  const filtered = items.filter((usuario) =>
    `${usuario.nome} ${usuario.email_institucional} ${usuario.tipo}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ModuleScreen
        kicker="SENAI Grid"
        title="Usuários"
        description="Controle de acesso da equipe interna do Grid."
        isLoading={loading}
        actionLabel="+ Novo usuário"
        onActionPress={() => {
          setEditing(null);
          setModalOpen(true);
        }}
      >
        <View style={styles.metricGrid}>
          <MetricTile label="Usuários ativos" value={items.filter((u) => u.status === 'ativo').length} accent={gridTheme.accent} icon={<Users size={16} color={gridTheme.accent} />} style={styles.metric} />
          <MetricTile label="Manutenção" value={items.filter((u) => `${u.tipo}`.includes('manutencao')).length} accent={colors.blue} icon={<UserCheck size={16} color={colors.blue} />} style={styles.metric} />
          <MetricTile label="Administradores" value={items.filter((u) => u.tipo === 'admin').length} accent={colors.red} icon={<ShieldCheck size={16} color={colors.red} />} style={styles.metric} />
          <MetricTile label="Total" value={items.length} accent={colors.orange} icon={<UserPlus size={16} color={colors.orange} />} style={styles.metric} />
        </View>

        <SearchField placeholder="Buscar usuário, e-mail, cargo ou permissão..." value={search} onChangeText={setSearch} />

        <SurfaceCard title="Equipe cadastrada" subtitle="Usuários internos e níveis de acesso">
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {filtered.length === 0 ? <Text style={styles.empty}>Nenhum usuário encontrado.</Text> : null}
          {filtered.map((usuario) => (
            <ListRow
              key={usuario.id}
              title={usuario.nome}
              subtitle={`${usuario.tipo} • ${usuario.email_institucional}`}
              badge={usuario.status}
              badgeVariant={usuario.status === 'ativo' ? 'success' : 'neutral'}
              meta="BD"
              initials={initials(usuario.nome)}
              accent={usuario.tipo === 'admin' ? colors.red : colors.blue}
              onEdit={() => {
                setEditing(usuario);
                setModalOpen(true);
              }}
              onDelete={() => deleteItem(usuario.id, usuario.nome)}
            />
          ))}
        </SurfaceCard>
      </ModuleScreen>

      <CrudModal
        visible={modalOpen}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        fields={fields}
        initialValues={editing ? formValues(editing) : { tipo: 'manutencao', status: 'ativo' }}
        isSubmitting={submitting}
        submitLabel={editing ? 'Salvar alterações' : 'Criar usuário'}
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
