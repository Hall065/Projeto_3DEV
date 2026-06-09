export type HubModule = 'connect' | 'grid' | 'safe'

/** Chave i18n para item de navegacao (nav.{module}.{segment}). */
export function navI18nKey(module: HubModule, to: string): string {
  if (to === `/${module}`) {
    return `nav.${module}.overview`
  }

  const segment = to.replace(`/${module}/`, '')
  const aliases: Record<string, string> = {
    'gerenciar-frequencia': 'manageAttendance',
    'contratos/alunos': 'contracts',
    autorizacoes: 'authorizations',
    aprovacoes: 'approvals',
    relatorio: 'reports',
    relatorios: 'reports',
    localizacao: 'location',
    planilhas: 'spreadsheets',
    chamados: 'tickets',
    tarefas: 'tasks',
    estoque: 'inventory',
    mapa: 'map',
    usuarios: 'users',
    controle: 'control',
    pessoas: 'people',
    professores: 'teachers',
    turmas: 'classes',
    cursos: 'courses',
    calendario: 'calendar',
    frequencia: 'attendance',
    salario: 'salary',
    alunos: 'students',
  }

  return `nav.${module}.${aliases[segment] ?? segment}`
}
