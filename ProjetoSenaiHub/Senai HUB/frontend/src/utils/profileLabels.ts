const PERMISSION_LABELS: Record<string, string> = {
  'connect.access': 'Acesso ao Connect',
  'connect.dashboard': 'Painel Connect',
  'connect.people.manage': 'Gestao de pessoas',
  'connect.students.manage': 'Gestao de alunos',
  'connect.students.view': 'Visualizar alunos',
  'connect.teachers.manage': 'Gestao de professores',
  'connect.teachers.view': 'Visualizar professores',
  'connect.courses.view': 'Visualizar cursos',
  'connect.contracts.view': 'Visualizar contratos',
  'connect.contracts.view_own': 'Contratos proprios',
  'connect.salary.view': 'Visualizar salario',
  'connect.salary.view_own': 'Salario proprio',
  'connect.attendance.view_own': 'Frequencia propria',
  'connect.classes.manage': 'Gestao de turmas',
  'connect.classes.view': 'Visualizar turmas',
  'connect.courses.manage': 'Gestao de cursos',
  'connect.contracts.manage': 'Gestao de contratos',
  'connect.attendance.view': 'Visualizar frequencia',
  'connect.attendance.manage': 'Registrar frequencia',
  'connect.reports.view': 'Relatorios Connect',
  'connect.spreadsheets': 'Planilhas Connect',
  'connect.location.view': 'Localizacao no campus',
  'grid.access': 'Acesso ao Grid',
  'grid.dashboard': 'Painel Grid',
  'grid.tickets.manage': 'Gestao de chamados',
  'grid.tickets.view': 'Visualizar chamados',
  'grid.tickets.update': 'Atualizar chamados',
  'grid.controle': 'Controle de chamados',
  'grid.tasks.map': 'Mapa de tarefas',
  'grid.tasks.manage': 'Gestao de tarefas',
  'grid.inventory.manage': 'Gestao de estoque',
  'grid.inventory.view': 'Visualizar estoque',
  'grid.users.manage': 'Gestao de usuarios Grid',
  'grid.reports.view': 'Relatorios Grid',
  'grid.spreadsheets': 'Planilhas Grid',
  'hub.users.manage': 'Gestao de usuarios',
}

export function formatPermissionLabel(permission: string): string {
  if (permission === '*') {
    return 'Acesso total ao sistema'
  }

  return PERMISSION_LABELS[permission] ?? permission.replaceAll('.', ' · ').replaceAll('_', ' ')
}

export function groupPermissions(permissions: string[]): { module: string; items: string[] }[] {
  if (permissions.includes('*')) {
    return [{ module: 'Sistema', items: ['Acesso total ao sistema'] }]
  }

  const groups = new Map<string, string[]>()

  for (const permission of permissions) {
    const [prefix] = permission.split('.')
    const module =
      prefix === 'connect' ? 'Connect' : prefix === 'grid' ? 'Grid' : prefix === 'hub' ? 'Hub' : 'Outros'
    const list = groups.get(module) ?? []
    list.push(formatPermissionLabel(permission))
    groups.set(module, list)
  }

  return Array.from(groups.entries()).map(([module, items]) => ({ module, items }))
}
