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

function nullIfEmpty(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
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

async function selectRows(table: string, select = '*') {
  const { data, error } = await supabase.schema(schema).from(table).select(select);
  if (error) {
    const fallback = await supabase.schema(schema).from(table).select('*');
    if (fallback.error) throw error;
    return fallback.data ?? [];
  }
  return data ?? [];
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
  return {
    id: row.id,
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
    const rows = await selectRows(
      'chamados',
      '*, categoria:categoria_id(id,nome), bloco:bloco_id(id,nome), sala:sala_id(id,nome), solicitante:aberto_por(id,nome)'
    );
    return rows.map(mapChamado);
  },

  createChamado(values: FormValues, userId?: string | null) {
    return insertWithFallback('chamados', [
      {
        codigo: nullIfEmpty(values.codigo) ?? makeCodigo(),
        aberto_por: userId ?? nullIfEmpty(values.aberto_por),
        categoria_id: nullIfEmpty(values.categoria_id),
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        bloco_id: nullIfEmpty(values.bloco_id),
        sala_id: nullIfEmpty(values.sala_id),
        prioridade: normalizeStatus(values.prioridade, 'media') as ChamadoPrioridade,
        status: normalizeStatus(values.status, 'aberto') as ChamadoStatus,
      },
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        prioridade: normalizeStatus(values.prioridade, 'media'),
        status: normalizeStatus(values.status, 'aberto'),
        solicitante_id: userId ?? nullIfEmpty(values.solicitante_id),
      },
    ]);
  },

  updateChamado(id: string, values: FormValues) {
    return updateWithFallback('chamados', id, [
      {
        codigo: nullIfEmpty(values.codigo),
        categoria_id: nullIfEmpty(values.categoria_id),
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao) ?? '',
        bloco_id: nullIfEmpty(values.bloco_id),
        sala_id: nullIfEmpty(values.sala_id),
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
    const rows = await selectRows(
      'tarefas',
      '*, chamado:chamado_id(id,codigo,titulo,descricao,prioridade), responsavel:responsavel_id(id,nome)'
    );
    return rows.map(mapTarefa);
  },

  async createTarefa(values: FormValues, userId?: string | null) {
    let chamadoId = nullIfEmpty(values.chamado_id);
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
        responsavel_id: nullIfEmpty(values.responsavel_id),
        atribuido_por: userId ?? nullIfEmpty(values.atribuido_por),
        status: normalizeStatus(values.status, 'a_fazer') as TarefaStatus,
        observacao: nullIfEmpty(values.observacao ?? values.descricao),
      },
      {
        chamado_id: chamadoId,
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        prioridade: normalizeStatus(values.prioridade, 'media'),
        responsavel_id: nullIfEmpty(values.responsavel_id),
        status: normalizeStatus(values.status, 'a_fazer'),
      },
    ]);
  },

  updateTarefa(id: string, values: FormValues) {
    return updateWithFallback('tarefas', id, [
      {
        responsavel_id: nullIfEmpty(values.responsavel_id),
        status: normalizeStatus(values.status, 'a_fazer') as TarefaStatus,
        observacao: nullIfEmpty(values.observacao ?? values.descricao),
      },
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        prioridade: normalizeStatus(values.prioridade, 'media'),
        responsavel_id: nullIfEmpty(values.responsavel_id),
        status: normalizeStatus(values.status, 'a_fazer'),
      },
    ]);
  },

  deleteTarefa: (id: string) => deleteRow('tarefas', id),

  async listEstoque(): Promise<ItemEstoque[]> {
    const rows = await selectRows(
      'itens_estoque',
      '*, categoria:categoria_id(id,nome)'
    );
    return rows.map(mapItem);
  },

  createEstoque(values: FormValues) {
    const quantidade = numberOrZero(values.quantidade_disponivel);
    const minima = numberOrZero(values.quantidade_minima);
    return insertWithFallback('itens_estoque', [
      {
        titulo: nullIfEmpty(values.titulo),
        descricao: nullIfEmpty(values.descricao),
        categoria_id: nullIfEmpty(values.categoria_id),
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
        categoria_id: nullIfEmpty(values.categoria_id),
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
