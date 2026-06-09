import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAzureTranslatorConfigured, translateTextsWithAzure } from '@/services/azure-translator.service';
import { APP_LANGUAGE_OPTIONS, useAppStore, type AppLanguage } from '@/stores/app.store';

const en: Record<string, string> = {
  'Acesse sua conta': 'Sign in to your account',
  'Informe seu e-mail e senha para continuar.': 'Enter your email and password to continue.',
  'E-mail': 'Email',
  'Senha': 'Password',
  'Entrar': 'Sign in',
  'Recuperar senha': 'Recover password',
  'Acesso rápido para demonstração': 'Quick demo access',
  'Preparando o SENAI Hub...': 'Preparing SENAI Hub...',
  'Carregando informações...': 'Loading information...',
  'Cancelar': 'Cancel',
  'Excluir': 'Delete',
  'Excluir registro': 'Delete record',
  'Salvar': 'Save',
  'Salvar alterações': 'Save changes',
  'Criar usuário': 'Create user',
  'Editar usuário': 'Edit user',
  'Novo usuário': 'New user',
  'Voltar': 'Back',
  'Voltar ao Hub': 'Back to Hub',
  'Sair': 'Sign out',
  'Usuário': 'User',
  'Perfil do usuario': 'User profile',
  'Perfil do usuário': 'User profile',
  'Dados da sua conta SENAI Hub': 'Your SENAI Hub account data',
  'Trocar foto': 'Change photo',
  'Dados pessoais': 'Personal data',
  'Edicao protegida por senha': 'Password-protected editing',
  'Edição protegida por senha': 'Password-protected editing',
  'Nome': 'Name',
  'Telefone': 'Phone',
  'CPF': 'CPF',
  'Senha atual': 'Current password',
  'Editar perfil': 'Edit profile',
  'Seguranca': 'Security',
  'Segurança': 'Security',
  'Senha e recuperacao': 'Password and recovery',
  'Senha e recuperação': 'Password and recovery',
  'Alterar senha': 'Change password',
  'Use o fluxo de recuperacao por codigo': 'Use the code recovery flow',
  'Use o fluxo de recuperação por código': 'Use the code recovery flow',
  'Abrir recuperacao de senha': 'Open password recovery',
  'Abrir recuperação de senha': 'Open password recovery',
  'Informacoes do sistema': 'System information',
  'Informações do sistema': 'System information',
  'Acesso e versao': 'Access and version',
  'Acesso e versão': 'Access and version',
  'Perfil de acesso': 'Access profile',
  'Ultimo login': 'Last login',
  'Último login': 'Last login',
  'Sessao atual': 'Current session',
  'Sessão atual': 'Current session',
  'Versao do app': 'App version',
  'Versão do app': 'App version',
  'Conta protegida': 'Protected account',
  'Confirmacao por senha ativa': 'Password confirmation enabled',
  'Confirmação por senha ativa': 'Password confirmation enabled',
  'Preferências': 'Preferences',
  'Tema e idioma do aplicativo': 'Application theme and language',
  'Modo claro': 'Light mode',
  'Modo escuro': 'Dark mode',
  'Tema atual': 'Current theme',
  'Idioma': 'Language',
  'Português (Brasil)': 'Portuguese (Brazil)',
  'Espanhol': 'Spanish',
  'Francês': 'French',
  'Alemão': 'German',
  'Italiano': 'Italian',
  'Japonês': 'Japanese',
  'Chinês simplificado': 'Simplified Chinese',
  'Idioma atual': 'Current language',
  'Traducao do aplicativo': 'Application translation',
  'Tradução do aplicativo': 'Application translation',
  'Alterar idioma': 'Change language',
  'Selecionar idioma': 'Select language',
  'Aplicar idioma': 'Apply language',
  'Idioma de tradução': 'Translation language',
  'Escolha um idioma para traduzir o aplicativo pela API do Azure.': 'Choose a language to translate the application through the Azure API.',
  'Português': 'Portuguese',
  'Inglês': 'English',
  'Aplicar modo escuro': 'Apply dark mode',
  'Aplicar modo claro': 'Apply light mode',
  'Usar inglês': 'Use English',
  'Usar português': 'Use Portuguese',
  'SENAI Connect': 'SENAI Connect',
  'SENAI Grid': 'SENAI Grid',
  'SENAI Aluno': 'SENAI Student',
  'Acesso liberado conforme seu perfil': 'Access granted according to your profile',
  'Acessar aplicativo': 'Open application',
  'Bem-vindo': 'Welcome',
  'Hub de Aplicações': 'Application Hub',
  'Acesse os sistemas disponíveis para o seu perfil.': 'Access the systems available to your profile.',
  'Gestão completa de alunos, turmas, frequência, contratos e informações acadêmicas.': 'Complete management of students, classes, attendance, contracts and academic information.',
  'Gestão de manutenção predial, infraestrutura, chamados, estoque e equipes.': 'Building maintenance, infrastructure, tickets, inventory and teams management.',
  'Ensino conectado e gestão acadêmica': 'Connected learning and academic management',
  'Gestão de manutenção e infraestrutura': 'Maintenance and infrastructure management',
  'Hub Unificado de Infraestrutura e Serviços': 'Unified infrastructure and services hub',
  'Visão geral': 'Overview',
  'Dashboard': 'Dashboard',
  'Início': 'Home',
  'Inicio': 'Home',
  'Alunos': 'Students',
  'Professores': 'Teachers',
  'Usuários Connect': 'Connect users',
  'Turmas': 'Classes',
  'Cursos': 'Courses',
  'Empresas': 'Companies',
  'Frequência': 'Attendance',
  'Frequencia': 'Attendance',
  'Gerenciar frequência': 'Manage attendance',
  'Gerenciar frequencia': 'Manage attendance',
  'Relatórios': 'Reports',
  'Relatorios': 'Reports',
  'Localização': 'Location',
  'Localizacao': 'Location',
  'Contratos': 'Contracts',
  'Contrato alunos': 'Student contracts',
  'Salário': 'Salary',
  'Salario': 'Salary',
  'Chamados': 'Tickets',
  'Tarefas': 'Tasks',
  'Estoque': 'Inventory',
  'Mapa de tarefas': 'Task map',
  'Usuários': 'Users',
  'Perfil': 'Profile',
  'Grade': 'Schedule',
  'Painel': 'Panel',
  'Acadêmico': 'Academic',
  'Operação': 'Operations',
  'Administração': 'Administration',
  'Recursos': 'Resources',
  'Meu perfil': 'My profile',
  'Dados academicos principais': 'Main academic data',
  'Dados acadêmicos principais': 'Main academic data',
  'Resumo de frequencia': 'Attendance summary',
  'Resumo de frequência': 'Attendance summary',
  'Lancamentos deste mes': 'Records this month',
  'Lançamentos deste mês': 'Records this month',
  'Aulas recentes': 'Recent classes',
  'Ultimos registros encontrados': 'Latest records found',
  'Últimos registros encontrados': 'Latest records found',
  'Frequencia e salario': 'Attendance and salary',
  'Frequência e salário': 'Attendance and salary',
  'Calculo automatico do mes': 'Automatic monthly calculation',
  'Cálculo automático do mês': 'Automatic monthly calculation',
  'Mes anterior': 'Previous month',
  'Mês anterior': 'Previous month',
  'Proximo': 'Next',
  'Próximo': 'Next',
  'Exportar holerite': 'Export payslip',
  'Detalhes do calculo': 'Calculation details',
  'Detalhes do cálculo': 'Calculation details',
  'Formula baseada na frequencia': 'Formula based on attendance',
  'Fórmula baseada na frequência': 'Formula based on attendance',
  'Lancamentos': 'Records',
  'Lançamentos': 'Records',
  'Presencas e faltas no mes': 'Attendance and absences this month',
  'Presenças e faltas no mês': 'Attendance and absences this month',
  'Grade de aulas': 'Class schedule',
  'Aulas registradas e presenca': 'Registered classes and attendance',
  'Aulas registradas e presença': 'Registered classes and attendance',
  'Curso vinculado': 'Linked course',
  'Informações acadêmicas do aluno': 'Student academic information',
  'Aulas do dia': 'Classes of the day',
  'Horario, disciplina e status': 'Time, subject and status',
  'Horário, disciplina e status': 'Time, subject and status',
  'Dados academicos': 'Academic data',
  'Dados acadêmicos': 'Academic data',
  'Curso, turma e empresa': 'Course, class and company',
  'Contrato': 'Contract',
  'Vinculo com empresa': 'Company link',
  'Vínculo com empresa': 'Company link',
  'Ativo': 'Active',
  'Inativo': 'Inactive',
  'ativo': 'active',
  'inativo': 'inactive',
  'bloqueado': 'blocked',
  'pendente': 'pending',
  'aberto': 'open',
  'aguardando': 'waiting',
  'em_andamento': 'in progress',
  'concluido': 'completed',
  'concluida': 'completed',
  'a_fazer': 'to do',
  'presente': 'present',
  'falta_justificada': 'excused absence',
  'falta_injustificada': 'unexcused absence',
  'Abertos': 'Open',
  'Alta prioridade': 'High priority',
  'Em análise': 'In review',
  'Resolvidos': 'Resolved',
  'Total': 'Total',
  'Todos': 'All',
  'Alta': 'High',
  'Em andamento': 'In progress',
  'Concluídos': 'Completed',
  'A fazer': 'To do',
  'Concluídas': 'Completed',
  'Novo aluno': 'New student',
  'Editar aluno': 'Edit student',
  'Criar aluno': 'Create student',
  'Novo professor': 'New teacher',
  'Editar professor': 'Edit teacher',
  'Criar professor': 'Create teacher',
  'Nova turma': 'New class',
  'Editar turma': 'Edit class',
  'Criar turma': 'Create class',
  'Abrir chamado': 'Open ticket',
  'Editar chamado': 'Edit ticket',
  'Nova tarefa': 'New task',
  'Editar tarefa': 'Edit task',
  'Criar tarefa': 'Create task',
  'Selecionar imagem': 'Select image',
  'Trocar imagem': 'Change image',
  'Nenhum dado cadastrado ainda.': 'No data registered yet.',
  'Notificacoes': 'Notifications',
  'Notificações': 'Notifications',
  'Marcar todas como lidas': 'Mark all as read',
  'Carregando notificacoes...': 'Loading notifications...',
  'Carregando notificações...': 'Loading notifications...',
  'Nenhuma notificacao encontrada.': 'No notification found.',
  'Nenhuma notificação encontrada.': 'No notification found.',
  'Confirmar': 'Confirm',
  'Exportar dados': 'Export data',
  'Imagem de abertura': 'Opening image',
  'Evidencia de conclusao': 'Completion evidence',
  'Evidência de conclusão': 'Completion evidence',
  'Controle de acesso da equipe interna do Grid.': 'Access control for the internal Grid team.',
  'Usuários ativos': 'Active users',
  'Manutenção': 'Maintenance',
  'Gerentes': 'Managers',
  'Equipe cadastrada': 'Registered team',
  'Usuários internos e níveis de acesso': 'Internal users and access levels',
  '+ Novo usuário': '+ New user',
  'Resumo operacional da manutenção e infraestrutura.': 'Operational summary of maintenance and infrastructure.',
  'Operação de infraestrutura': 'Infrastructure operations',
  'Prioridades e chamados em tempo real': 'Priorities and tickets in real time',
  'chamados abertos': 'open tickets',
  'Chamados abertos': 'Open tickets',
  'Estoque crítico': 'Critical inventory',
  'Atalhos rápidos': 'Quick shortcuts',
  'Acesso direto às rotinas de manutenção': 'Direct access to maintenance routines',
  'Mapa': 'Map',
  'Chamados recentes': 'Recent tickets',
  'Últimas solicitações registradas': 'Latest registered requests',
  'Tarefas por prioridade': 'Tasks by priority',
  'Distribuição real dos chamados': 'Actual ticket distribution',
  'Itens com estoque baixo': 'Low-stock items',
  'Peças que exigem reposição': 'Parts requiring restock',
  'Controle de itens, reservas e movimentações.': 'Control items, reservations and movements.',
  '+ Adicionar item': '+ Add item',
  'Total de itens': 'Total items',
  'Valor em estoque': 'Inventory value',
  'Indisponiveis': 'Unavailable',
  'Distribuidoras': 'Distributors',
  'Itens cadastrados': 'Registered items',
  'Lista de materiais de manutenção': 'Maintenance material list',
  'Editar item': 'Edit item',
  'Adicionar item': 'Add item',
  'Indicadores de manutencao calculados a partir do Supabase.': 'Maintenance indicators calculated from Supabase.',
  'Tarefas concluidas': 'Completed tasks',
  'Tarefas abertas': 'Open tasks',
  'Custo em estoque': 'Inventory cost',
  'Chamados por status': 'Tickets by status',
  'Distribuicao real das solicitacoes': 'Actual request distribution',
  'Exportacoes': 'Exports',
  'Arquivos gerados': 'Generated files',
  'Exportar manutencoes': 'Export maintenance records',
  'Visualize serviços por bloco, sala e criticidade.': 'View services by block, room and criticality.',
  'Mapa do SENAI': 'SENAI map',
  'Pins coloridos indicam o status dos chamados': 'Colored pins indicate ticket status',
  'Aberto': 'Open',
  'Concluído': 'Completed',
  'Crítico': 'Critical',
  'Tarefas no mapa': 'Tasks on the map',
  'Finalizadas': 'Finished',
  'Atrasadas': 'Delayed',
  'Serviços próximos da sua localização': 'Services near your location',
  'Abertura e acompanhamento dos seus chamados.': 'Open and track your tickets.',
  'Abertura, triagem e acompanhamento de solicitações.': 'Open, triage and track requests.',
  '+ Abrir chamado': '+ Open ticket',
  'Fila de chamados': 'Ticket queue',
  'Dados carregados do Supabase': 'Data loaded from Supabase',
  'Kanban de serviços de manutenção e acompanhamento.': 'Maintenance service kanban and tracking.',
  'Suas tarefas atribuídas e atualização de status.': 'Your assigned tasks and status updates.',
  '+ Adicionar': '+ Add',
  'Turmas e Cursos': 'Classes and courses',
  'Consulte suas turmas e os alunos vinculados.': 'View your classes and linked students.',
  'Gerencie turmas, cursos e vínculos acadêmicos.': 'Manage classes, courses and academic links.',
  '+ Criar turma': '+ Create class',
  'Turmas ativas': 'Active classes',
  'Cursos vinculados': 'Linked courses',
  'Períodos': 'Periods',
  'Turmas ativas e período de aulas': 'Active classes and class period',
  'Gerenciamento de alunos': 'Student management',
  'Cadastro, busca e atualização de alunos.': 'Register, search and update students.',
  '+ Novo aluno': '+ New student',
  'Alunos encontrados': 'Students found',
  'Novos no mês': 'New this month',
  'Lista de alunos': 'Student list',
  'Dados principais e situação acadêmica': 'Main data and academic status',
  'Gerenciamento de professores': 'Teacher management',
  'Cadastro, especialidades e status dos docentes.': 'Teacher registration, specialties and status.',
  '+ Novo professor': '+ New teacher',
  'Especialidades': 'Specialties',
  'Professores cadastrados': 'Registered teachers',
  'Equipe docente ativa': 'Active teaching staff',
  'Cadastro de secretaria, direção e administradores do Connect.': 'Register Connect secretary, management and administrators.',
  'Secretaria': 'Secretary',
  'Admin': 'Admin',
  'Equipe administrativa': 'Administrative team',
  'Usuários com acesso ao SENAI Connect': 'Users with SENAI Connect access',
  'Monitoramento por turma, aluno e geofence.': 'Monitoring by class, student and geofence.',
  'Monitorados': 'Monitored',
  'No campus': 'On campus',
  'Fora': 'Outside',
  'Lista': 'List',
  'Turmas e alunos': 'Classes and students',
  'Buscar turmas ou alunos...': 'Search classes or students...',
  'Ver localizacao': 'View location',
  'Mapa 2.5D do campus': '2.5D campus map',
  'Pin atualizado por Realtime': 'Pin updated by Realtime',
  'Visualizacao, calculo e exportacao de relatorios.': 'View, calculate and export reports.',
  'Presenca geral': 'Overall attendance',
  'Alunos monitorados': 'Monitored students',
  'Evolucao da frequencia': 'Attendance evolution',
  'Comparativo dos registros reais': 'Comparison of actual records',
  'Turmas recentes': 'Recent classes',
  'Status de calculo e fechamento': 'Calculation and closing status',
  'Indicadores de ausencia': 'Absence indicators',
  'Faltas justificadas e injustificadas': 'Excused and unexcused absences',
  'Exportar frequencia': 'Export attendance',
  'Indicadores academicos calculados a partir do Supabase.': 'Academic indicators calculated from Supabase.',
  'Frequencias': 'Attendance records',
  'Cursos ativos': 'Active courses',
  'Frequencia registrada': 'Registered attendance',
  'Distribuicao real dos lancamentos': 'Actual record distribution',
  'Contratos de aprendizagem vinculados às empresas.': 'Apprenticeship contracts linked to companies.',
  '+ Novo contrato': '+ New contract',
  'Contratos ativos': 'Active contracts',
  'Empresas parceiras': 'Partner companies',
  'Pendências': 'Pending items',
  'Contratos vigentes': 'Current contracts',
  'Contratos de aprendizagem': 'Apprenticeship contracts',
  'Cálculo mensal com base em faltas injustificadas.': 'Monthly calculation based on unexcused absences.',
  '+ Novo cálculo': '+ New calculation',
  'Bolsa média': 'Average stipend',
  'Total base': 'Base total',
  'Meses': 'Months',
  'Cálculo do salário': 'Salary calculation',
  'Exportar PDF ou Excel': 'Export PDF or Excel',
  'Alunos calculados': 'Calculated students',
  'Fechamento mensal por status': 'Monthly closing by status',
  'Novo salário': 'New salary',
  'Editar salário': 'Edit salary',
  'Exportar salarios': 'Export salaries',
  'Cursos por período': 'Courses by period',
  'Distribuição do catálogo atual': 'Current catalog distribution',
  'Catálogo': 'Catalog',
  'Cursos cadastrados': 'Registered courses',
  'Editar curso': 'Edit course',
  'Novo curso': 'New course',
  'Carga média': 'Average workload',
};

const knownTranslationSources = Object.freeze(Object.keys(en));

type RemoteLanguage = Exclude<AppLanguage, 'pt-BR'>;
type RemoteTranslationCache = Partial<Record<RemoteLanguage, Record<string, string>>>;

const AZURE_TRANSLATION_CACHE_KEY = '@senai-hub/azure-translations/v1';
const AZURE_BATCH_SIZE = 50;
const AZURE_RETRY_DELAY_MS = 60_000;

const remoteCache: RemoteTranslationCache = {};
const pendingTranslations: Partial<Record<RemoteLanguage, Set<string>>> = {};

const listeners = new Set<() => void>();
let cacheLoaded = false;
let cacheLoadPromise: Promise<void> | null = null;
let queueTimer: ReturnType<typeof setTimeout> | null = null;
let lastAzureFailureAt = 0;

function isRemoteLanguage(language: AppLanguage): language is RemoteLanguage {
  return language !== 'pt-BR';
}

function getRemoteLanguageCache(language: RemoteLanguage) {
  remoteCache[language] ??= {};
  return remoteCache[language];
}

function getPendingTranslationQueue(language: RemoteLanguage) {
  pendingTranslations[language] ??= new Set<string>();
  return pendingTranslations[language];
}

function getLocalTranslation(value: string, language: AppLanguage): string | undefined {
  if (language === 'en-US') return en[value];
  return undefined;
}

function getRemoteTranslation(value: string, language: AppLanguage): string | undefined {
  if (!isRemoteLanguage(language)) return undefined;
  return getRemoteLanguageCache(language)[value];
}

function hasTranslation(value: string, language: AppLanguage): boolean {
  return Boolean(getLocalTranslation(value, language) || getRemoteTranslation(value, language));
}

function notifyTranslationListeners() {
  listeners.forEach((listener) => listener());
}

function subscribeToTranslations(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function loadRemoteCache() {
  if (cacheLoaded) return;
  if (!cacheLoadPromise) {
    cacheLoadPromise = AsyncStorage.getItem(AZURE_TRANSLATION_CACHE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<RemoteTranslationCache>;
        APP_LANGUAGE_OPTIONS.forEach((option) => {
          if (!isRemoteLanguage(option.code)) return;
          const cachedLanguage = parsed[option.code];
          if (cachedLanguage && typeof cachedLanguage === 'object') {
            remoteCache[option.code] = {
              ...getRemoteLanguageCache(option.code),
              ...cachedLanguage,
            };
          }
        });
      })
      .catch((error) => {
        console.warn('[Translator] Nao foi possivel carregar cache de traducoes:', error);
      })
      .finally(() => {
        cacheLoaded = true;
        cacheLoadPromise = null;
      });
  }

  await cacheLoadPromise;
}

async function saveRemoteCache() {
  try {
    await AsyncStorage.setItem(AZURE_TRANSLATION_CACHE_KEY, JSON.stringify(remoteCache));
  } catch (error) {
    console.warn('[Translator] Nao foi possivel salvar cache de traducoes:', error);
  }
}

async function flushPendingTranslations() {
  await loadRemoteCache();
  let updated = false;

  await Promise.all(
    (Object.keys(pendingTranslations) as RemoteLanguage[]).map(async (language) => {
      const queue = getPendingTranslationQueue(language);
      const texts = Array.from(queue).filter((text) => !hasTranslation(text, language));
      queue.clear();

      for (let index = 0; index < texts.length; index += AZURE_BATCH_SIZE) {
        const batch = texts.slice(index, index + AZURE_BATCH_SIZE);
        if (batch.length === 0) continue;

        const translations = await translateTextsWithAzure(batch, language);
        Object.assign(getRemoteLanguageCache(language), translations);
        updated = updated || Object.keys(translations).length > 0;
      }
    })
  );

  if (updated) {
    await saveRemoteCache();
    notifyTranslationListeners();
  }
}

export async function preloadTranslationsForLanguage(language: AppLanguage) {
  if (!isRemoteLanguage(language)) return;
  if (language !== 'en-US' && !isAzureTranslatorConfigured) {
    throw new Error('Configure a chave do Azure Translator para usar este idioma.');
  }

  await loadRemoteCache();
  const texts = knownTranslationSources.filter((text) => !hasTranslation(text, language));
  if (texts.length === 0) return;

  let updated = false;
  for (let index = 0; index < texts.length; index += AZURE_BATCH_SIZE) {
    const batch = texts.slice(index, index + AZURE_BATCH_SIZE);
    const translations = await translateTextsWithAzure(batch, language);
    Object.assign(getRemoteLanguageCache(language), translations);
    updated = updated || Object.keys(translations).length > 0;
  }

  if (updated) {
    await saveRemoteCache();
    notifyTranslationListeners();
  }
}

function queueAzureTranslation(value: string | undefined | null, language: AppLanguage) {
  if (!value || !isRemoteLanguage(language) || !isAzureTranslatorConfigured) return;
  if (Date.now() - lastAzureFailureAt < AZURE_RETRY_DELAY_MS) return;

  const text = value.trim();
  if (!text || hasTranslation(text, language)) return;

  getPendingTranslationQueue(language).add(text);
  if (queueTimer) return;

  queueTimer = setTimeout(() => {
    queueTimer = null;
    void flushPendingTranslations().catch((error) => {
      lastAzureFailureAt = Date.now();
      console.warn('[Translator] Falha ao traduzir com Azure:', error);
    });
  }, 120);
}

export function translate(value: string | undefined | null, language: AppLanguage) {
  if (!value || language === 'pt-BR') return value ?? '';

  const text = value.trim();
  if (!text) return value;

  return getLocalTranslation(text, language) ?? getRemoteTranslation(text, language) ?? value;
}

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const [, setTranslationVersion] = useState(0);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = subscribeToTranslations(() => {
      if (mounted) setTranslationVersion((version) => version + 1);
    });

    if (isRemoteLanguage(language)) {
      void loadRemoteCache().then(() => {
        if (mounted) setTranslationVersion((version) => version + 1);
      });
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [language]);

  const t = useCallback(
    (value: string | undefined | null) => {
      queueAzureTranslation(value, language);
      return translate(value, language);
    },
    [language]
  );

  return { language, t };
}
