import { supabase } from '@/lib/supabase';
import { createAuthUserProfile } from '@/services/user-profile.service';
import type {
  Chamado,
  ChamadoPrioridade,
  ChamadoStatus,
  GridCategoria,
  GridFornecedor,
  ItemEstoque,
  Tarefa,
  TarefaStatus,
} from '@/types/grid.types';
import type { HubUsuario } from '@/types/auth.types';

const schema = 'grid';
type Row = Record<string, any>;
type FormValues = Record<string, string>;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function nullIfEmpty(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function uuidOrNull(value: string | null | undefined, label: string) {
  const normalized = nullIfEmpty(value);
  if (!normalized) return null;
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error(`Selecione um ${label} valido.`);
  }
  return normalized;
}

function numberOrZero(value?: string | number | null) {
  if (typeof value === 'number') return value;
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value?: string | null, fallback = 'aberto') {
  return nullIfEmpty(value)?.toLowerCase().replace(/\s+/g, '_') ?? fallback;
}

function relation(row: Row, key: string) {
  const value = row[key];
  return Array.isArray(value) ? value[0] : value;
}

async function selectRows(table: string, select = '*', targetSchema = schema): Promise<Row[]> {
  const { data, error } = await supabase.schema(targetSchema).from(table).select(select);
  if (error) {
    const fallback = await supabase.schema(targetSchema).from(table).select('*');
    if (fallback.error) throw error;
    return (fallback.data ?? []) as Row[];
  }
  return (data ?? []) as Row[];
}

function uniqueIds(values: (string | null | undefined)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function indexById(rows: Row[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function selectRowsByIds(table: string, ids: string[], select = '*', targetSchema = schema): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.schema(targetSchema).from(table).select(select).in('id', ids);
  if (error) throw error;
  return (data ?? []) as Row[];
}

async function hydrateChamados(rows: Row[]) {
  const categorias = indexById(
    await selectRowsByIds('categorias_manutencao', uniqueIds(rows.map((row) => row.categoria_id)), 'id,nome')
  );
  const blocos = indexById(await selectRowsByIds('blocos', uniqueIds(rows.map((row) => row.bloco_id)), 'id,nome', 'hub'));
  const salas = indexById(await selectRowsByIds('salas', uniqueIds(rows.map((row) => row.sala_id)), 'id,nome', 'hub'));
  const usuarios = indexById(
    await selectRowsByIds(
      'usuarios',
      uniqueIds([
        ...rows.map((row) => row.aberto_por),
        ...rows.map((row) => row.solicitante_id),
        ...rows.map((row) => row.responsavel_id),
      ]),
      'id,nome,email,email_institucional,tipo_usuario,status',
      'hub'
    )
  );

  return rows.map((row) => ({
    ...row,
    categoria: row.categoria ?? categorias.get(row.categoria_id),
    bloco: row.bloco ?? blocos.get(row.bloco_id),
    sala: row.sala ?? salas.get(row.sala_id),
    solicitante: row.solicitante ?? usuarios.get(row.aberto_por ?? row.solicitante_id),
    responsavel: row.responsavel ?? usuarios.get(row.responsavel_id),
  }));
}

async function hydrateTarefas(rows: Row[]) {
  const chamados = indexById(
    await hydrateChamados(await selectRowsByIds('chamados', uniqueIds(rows.map((row) => row.chamado_id)), '*'))
  );
  const usuarios = indexById(
    await selectRowsByIds(
      'usuarios',
      uniqueIds(rows.map((row) => row.responsavel_id)),
      'id,nome,email,email_institucional,tipo_usuario,status',
      'hub'
    )
  );

  return rows.map((row) => ({
    ...row,
    chamado: row.chamado ?? chamados.get(row.chamado_id),
    responsavel: row.responsavel ?? usuarios.get(row.responsavel_id),
  }));
}

async function hydrateEstoque(rows: Row[]) {
  const categorias = indexById(
    await selectRowsByIds('categorias_manutencao', uniqueIds(rows.map((row) => row.categoria_id)), 'id,nome')
  );
  const fornecedores = indexById(
    await selectRowsByIds('fornecedores', uniqueIds(rows.map((row) => row.fornecedor_id)), 'id,nome')
  );

  return rows.map((row) => ({
    ...row,
    categoria: row.categoria ?? categorias.get(row.categoria_id),
    fornecedor: row.fornecedor ?? fornecedores.get(row.fornecedor_id),
  }));
}

async function insertWithFallback(table: string, payloads: Row[]) {
  let lastError: unknown = null;
  for (const payload of payloads) {
    const { data, error } = await supabase.schema(schema).from(table).insert(payload).select('*').single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function updateWithFallback(table: string, id: string, payloads: Row[]) {
  let lastError: unknown = null;
  for (const payload of payloads) {
    const { data, error } = await supabase
      .schema(schema)
      .from(table)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function deleteRow(table: string, id: string) {
  const { error } = await supabase.schema(schema).from(table).delete().eq('id', id);
  if (error) throw error;
}

function makeCodigo() {
  return `FCH-${String(Date.now()).slice(-6)}`;
}

function mapChamado(row: Row): Chamado {
  const categoria = relation(row, 'categoria') ?? relation(row, 'categorias_chamado') ?? {};
  const bloco = relation(row, 'bloco') ?? relation(row, 'blocos') ?? {};
  const sala = relation(row, 'sala') ?? relation(row, 'salas') ?? {};
  const solicitante = relation(row, 'solicitante') ?? relation(row, 'usuarios') ?? {};
  return {
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    descricao: row.descricao,
    sala_id: row.sala_id,
    sala_nome: sala.nome,
    bloco_id: row.bloco_id,
    bloco_nome: bloco.nome,
    categoria_id: row.categoria_id,
    categoria_nome: categoria.nome,
    prioridade: row.prioridade ?? 'media',
    status: row.status ?? 'aberto',
    solicitante_id: row.solicitante_id ?? row.aberto_por,
    aberto_por: row.aberto_por,
    solicitante_nome: solicitante.nome,
    responsavel_id: row.responsavel_id,
    created_at: row.created_at ?? row.criado_em,
    data_abertura: row.data_abertura,
    data_fechamento: row.data_fechamento,
  };
}

function mapTarefa(row: Row): Tarefa {
  const chamado = relation(row, 'chamado') ?? relation(row, 'chamados') ?? {};
  const responsavel = relation(row, 'responsavel') ?? relation(row, 'usuarios') ?? {};
  return {
    id: row.id,
    chamado_id: row.chamado_id,
    chamado_codigo: chamado.codigo,
    titulo: row.titulo ?? chamado.titulo ?? 'Tarefa sem chamado',
    descricao: row.descricao ?? chamado.descricao ?? row.observacao,
    status: row.status ?? 'a_fazer',
    prioridade: row.prioridade ?? chamado.prioridade ?? 'media',
    responsavel_id: row.responsavel_id,
    responsavel_nome: responsavel.nome,
    observacao: row.observacao,
    data_inicio_reparo: row.data_inicio_reparo,
    data_termino_reparo: row.data_termino_reparo,
  };
}

function mapItem(row: Row): ItemEstoque {
  const categoria = relation(row, 'categoria') ?? relation(row, 'categorias_manutencao') ?? {};
  const fornecedor = relation(row, 'fornecedor') ?? relation(row, 'fornecedores') ?? {};
  return {
    id: row.id,
    fornecedor_id: row.fornecedor_id,
    titulo: row.titulo,
    descricao: row.descricao,
    quantidade_disponivel: Number(row.quantidade_disponivel ?? 0),
    quantidade_minima: Number(row.quantidade_minima ?? 0),
    unidade: row.unidade ?? 'un',
    localizacao: row.localizacao,
    empresa_distribuidora: row.empresa_distribuidora,
    status: row.status ?? 'disponivel',
    categoria_id: row.categoria_id,
    categoria_nome: categoria.nome,
    fornecedor_nome: fornecedor.nome,
    custo: row.custo == null ? null : Number(row.custo),
  };
}

function mapCategoria(row: Row): GridCategoria {
  return { id: row.id, nome: row.nome, descricao: row.descricao, status: row.status };
}

function mapFornecedor(row: Row): GridFornecedor {
  return {
    id: row.id,
    nome: row.nome,
    cnpj: row.cnpj,
    email: row.email,
    telefone: row.telefone,
    status: row.status,
  };
}

function mapUsuario(row: Row): HubUsuario {
  return {
    id: row.id,
    nome: row.nome,
    email_institucional: row.email_institucional ?? row.email,
    tipo: row.tipo_usuario ?? row.tipo,
    status: row.status ?? 'ativo',
    telefone: row.telefone,
    cpf: row.cpf,
    foto_url: row.foto_url,
    created_at: row.created_at ?? row.criado_em,
    updated_at: row.updated_at ?? row.atualizado_em,
  };
}

async function listHubUsuarios() {
  for (const targetSchema of ['hub', 'public']) {
    const { data, error } = await supabase.schema(targetSchema).from('usuarios').select('*');
    if (!error) return (data ?? []).map(mapUsuario);
  }
  return [];
}

async function createHubUsuario(values: FormValues) {
  const userId = await createAuthUserProfile({
    nome: nullIfEmpty(values.nome) ?? 'Sem nome',
    email: nullIfEmpty(values.email_institucional ?? values.email) ?? '',
    senha: nullIfEmpty(values.senha),
    tipoUsuario: normalizeStatus(values.tipo, 'manutencao'),
    telefone: nullIfEmpty(values.telefone),
    cpf: nullIfEmpty(values.cpf),
    status: normalizeStatus(values.status, 'ativo'),
  });

  const { data, error } = await supabase.schema('hub').from('usuarios').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

async function updateHubUsuario(id: string, values: FormValues) {
  const base = {
    nome: nullIfEmpty(values.nome),
    email_institucional: nullIfEmpty(values.email_institucional ?? values.email),
    telefone: nullIfEmpty(values.telefone),
    cpf: nullIfEmpty(values.cpf),
    status: normalizeStatus(values.status, 'ativo'),
  };
  const payloads = [
    { ...base, tipo_usuario: normalizeStatus(values.tipo, 'manutencao') },
    { ...base, tipo: normalizeStatus(values.tipo, 'manutencao') },
  ];
  let lastError: unknown = null;
  for (const targetSchema of ['hub', 'public']) {
    for (const payload of payloads) {
      const { data, error } = await supabase
        .schema(targetSchema)
        .from('usuarios')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (!error) return data;
      lastError = error;
    }
  }
  throw lastError;
}

async function deleteHubUsuario(id: string) {
  let lastError: unknown = null;
  for (const targetSchema of ['hub', 'public']) {
    const { error } = await supabase.schema(targetSchema).from('usuarios').delete().eq('id', id);
    if (!error) return;
    lastError = error;
  }
  throw lastError;
}

export const gridService = {
  async listChamados(): Promise<Chamado[]> {
    const rows = await hydrateChamados(await selectRows('chamados'));
    return rows.map(mapChamado);
  },

  createChamado(values: FormValues, userId?: string | null) {
    return insertWithFallback('chamados', [
      {
        codigo: nullIfEmpty(values.codigo) ?? makeCodigo(),
        aberto_por: uuidOrNull(userId ?? values.aberto_por, 'solicitante'),
        categoria_id: uuidOrNull(values.categoria_id, 'categoria'),
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        bloco_id: uuidOrNull(values.bloco_id, 'bloco'),
        sala_id: uuidOrNull(values.sala_id, 'sala'),
        prioridade: normalizeStatus(values.prioridade, 'media') as ChamadoPrioridade,
        status: normalizeStatus(values.status, 'aberto') as ChamadoStatus,
      },
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        prioridade: normalizeStatus(values.prioridade, 'media'),
        status: normalizeStatus(values.status, 'aberto'),
        solicitante_id: uuidOrNull(userId ?? values.solicitante_id, 'solicitante'),
      },
    ]);
  },

  updateChamado(id: string, values: FormValues) {
    return updateWithFallback('chamados', id, [
      {
        codigo: nullIfEmpty(values.codigo),
        categoria_id: uuidOrNull(values.categoria_id, 'categoria'),
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        bloco_id: uuidOrNull(values.bloco_id, 'bloco'),
        sala_id: uuidOrNull(values.sala_id, 'sala'),
        prioridade: normalizeStatus(values.prioridade, 'media') as ChamadoPrioridade,
        status: normalizeStatus(values.status, 'aberto') as ChamadoStatus,
      },
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        prioridade: normalizeStatus(values.prioridade, 'media'),
        status: normalizeStatus(values.status, 'aberto'),
      },
    ]);
  },

  deleteChamado: (id: string) => deleteRow('chamados', id),

  async listTarefas(): Promise<Tarefa[]> {
    const rows = await hydrateTarefas(await selectRows('tarefas'));
    return rows.map(mapTarefa);
  },

  async createTarefa(values: FormValues, userId?: string | null) {
    let chamadoId = uuidOrNull(values.chamado_id, 'chamado');
    if (!chamadoId) {
      const chamado = await gridService.createChamado(
        {
          titulo: values.titulo,
          descricao: values.descricao ?? values.observacao,
          prioridade: values.prioridade,
          status: 'aberto',
          categoria_id: values.categoria_id,
        },
        userId
      ) as Row;
      chamadoId = chamado.id;
    }

    return insertWithFallback('tarefas', [
      {
        chamado_id: chamadoId,
        responsavel_id: uuidOrNull(values.responsavel_id, 'responsavel'),
        atribuido_por: uuidOrNull(userId ?? values.atribuido_por, 'usuario'),
        status: normalizeStatus(values.status, 'a_fazer') as TarefaStatus,
        observacao: nullIfEmpty(values.observacao ?? values.descricao),
      },
      {
        chamado_id: chamadoId,
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        prioridade: normalizeStatus(values.prioridade, 'media'),
        responsavel_id: uuidOrNull(values.responsavel_id, 'responsavel'),
        status: normalizeStatus(values.status, 'a_fazer'),
      },
    ]);
  },

  updateTarefa(id: string, values: FormValues) {
    return updateWithFallback('tarefas', id, [
      {
        responsavel_id: uuidOrNull(values.responsavel_id, 'responsavel'),
        status: normalizeStatus(values.status, 'a_fazer') as TarefaStatus,
        observacao: nullIfEmpty(values.observacao ?? values.descricao),
      },
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        prioridade: normalizeStatus(values.prioridade, 'media'),
        responsavel_id: uuidOrNull(values.responsavel_id, 'responsavel'),
        status: normalizeStatus(values.status, 'a_fazer'),
      },
    ]);
  },

  deleteTarefa: (id: string) => deleteRow('tarefas', id),

  async listEstoque(): Promise<ItemEstoque[]> {
    const rows = await hydrateEstoque(await selectRows('itens_estoque'));
    return rows.map(mapItem);
  },

  createEstoque(values: FormValues) {
    const quantidade = numberOrZero(values.quantidade_disponivel);
    const minima = numberOrZero(values.quantidade_minima);
    return insertWithFallback('itens_estoque', [
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        categoria_id: uuidOrNull(values.categoria_id, 'categoria'),
        fornecedor_id: uuidOrNull(values.fornecedor_id, 'fornecedor'),
        quantidade_disponivel: quantidade,
        quantidade_minima: minima,
        unidade: nullIfEmpty(values.unidade) ?? 'un',
        localizacao: nullIfEmpty(values.localizacao) ?? 'N/A',
        empresa_distribuidora: nullIfEmpty(values.empresa_distribuidora),
        custo: numberOrZero(values.custo),
        status: normalizeStatus(values.status, quantidade <= minima ? 'estoque_baixo' : 'disponivel'),
      },
    ]);
  },

  updateEstoque(id: string, values: FormValues) {
    const quantidade = numberOrZero(values.quantidade_disponivel);
    const minima = numberOrZero(values.quantidade_minima);
    return updateWithFallback('itens_estoque', id, [
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        categoria_id: uuidOrNull(values.categoria_id, 'categoria'),
        fornecedor_id: uuidOrNull(values.fornecedor_id, 'fornecedor'),
        quantidade_disponivel: quantidade,
        quantidade_minima: minima,
        unidade: nullIfEmpty(values.unidade),
        localizacao: nullIfEmpty(values.localizacao),
        empresa_distribuidora: nullIfEmpty(values.empresa_distribuidora),
        custo: numberOrZero(values.custo),
        status: normalizeStatus(values.status, quantidade <= minima ? 'estoque_baixo' : 'disponivel'),
      },
    ]);
  },

  deleteEstoque: (id: string) => deleteRow('itens_estoque', id),

  async listCategoriasEstoque(): Promise<GridCategoria[]> {
    const rows = await selectRows('categorias_manutencao');
    return rows.map(mapCategoria);
  },

  async listFornecedores(): Promise<GridFornecedor[]> {
    const rows = await selectRows('fornecedores');
    return rows.map(mapFornecedor);
  },

  async listCategoriaOptions() {
    const categorias = await gridService.listCategoriasEstoque();
    return categorias.map((categoria) => ({
      value: categoria.id,
      label: categoria.nome,
      description: categoria.status ?? undefined,
    }));
  },

  async listFornecedorOptions() {
    const fornecedores = await gridService.listFornecedores();
    return fornecedores.map((fornecedor) => ({
      value: fornecedor.id,
      label: fornecedor.nome,
      description: fornecedor.cnpj ?? fornecedor.email ?? undefined,
    }));
  },

  async listUsuarioOptions() {
    const usuarios = await gridService.listUsuarios();
    return usuarios.map((usuario) => ({
      value: usuario.id,
      label: usuario.nome,
      description: usuario.tipo ?? usuario.email_institucional,
    }));
  },

  async listChamadoOptions() {
    const chamados = await gridService.listChamados();
    return chamados.map((chamado) => ({
      value: chamado.id,
      label: `${chamado.codigo ?? 'CH'} - ${chamado.titulo}`,
      description: chamado.status,
    }));
  },

  async listBlocoOptions() {
    const rows = await selectRows('blocos', '*', 'hub');
    return rows.map((bloco) => ({
      value: bloco.id,
      label: bloco.nome,
      description: bloco.descricao ?? undefined,
    }));
  },

  async listSalaOptions() {
    const rows = await selectRows('salas', '*, bloco:bloco_id(id,nome)', 'hub');
    return rows.map((sala) => {
      const bloco = relation(sala, 'bloco') ?? relation(sala, 'blocos') ?? {};
      return {
        value: sala.id,
        label: `${bloco.nome ? `${bloco.nome} - ` : ''}${sala.nome}`,
        description: sala.tipo ?? undefined,
      };
    });
  },

  listUsuarios: listHubUsuarios,
  createUsuario: createHubUsuario,
  updateUsuario: updateHubUsuario,
  deleteUsuario: deleteHubUsuario,

  async getDashboardMetrics() {
    const [abertos, emAndamento, estoque, concluidos] = await Promise.all([
      supabase
        .schema(schema)
        .from('chamados')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'aberto'),
      supabase
        .schema(schema)
        .from('chamados')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'em_andamento'),
      supabase
        .schema(schema)
        .from('itens_estoque')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'estoque_baixo'),
      supabase
        .schema(schema)
        .from('chamados')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'concluido'),
    ]);

    return {
      chamadosAbertos: abertos.count ?? 0,
      chamadosEmAndamento: emAndamento.count ?? 0,
      itensEstoqueBaixo: estoque.count ?? 0,
      chamadosConcluidos: concluidos.count ?? 0,
    };
  },
};
