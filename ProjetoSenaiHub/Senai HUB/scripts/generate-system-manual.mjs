/**
 * Gera MANUAL_DO_SISTEMA_SENAI_HUB.md com referências de linha atualizadas.
 * Executar: node scripts/generate-system-manual.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'GUIA_APRESENTACAO_SITE_SENAI_HUB.md')

function rel(p) {
  return p.replace(/\\/g, '/').replace(`${ROOT.replace(/\\/g, '/')}/`, 'Senai HUB/')
}

function linesOf(absPath) {
  if (!fs.existsSync(absPath)) return null
  return fs.readFileSync(absPath, 'utf8').split('\n').length
}

function ref(absPath, start, end, note = '') {
  const total = linesOf(absPath)
  const e = end ?? total
  const suffix = note ? ` — ${note}` : ''
  return `\`${rel(absPath)}\` (L${start}–L${e})${suffix}`
}

function feature({ id, title, module, route, permission, description, tables, endpoints, files, flow, components, tests, notes }) {
  let s = `### ${id}. ${title}\n\n`
  s += `| Campo | Valor |\n|---|---|\n`
  s += `| **Módulo** | ${module} |\n`
  if (route) s += `| **Rota UI** | \`${route}\` |\n`
  if (permission) s += `| **Permissão** | ${permission} |\n`
  s += `\n**O que é / o que faz:** ${description}\n\n`
  if (tables?.length) s += `**Tabelas e relacionamentos:** ${tables.join('; ')}.\n\n`
  if (endpoints?.length) {
    s += `**Endpoints API:**\n`
    for (const ep of endpoints) s += `- \`${ep}\`\n`
    s += '\n'
  }
  if (files?.length) {
    s += `**Referências no código:**\n\n`
    s += `| Camada | Arquivo (linhas) |\n|---|---|\n`
    for (const f of files) s += `| ${f.layer} | ${f.ref} |\n`
    s += '\n'
  }
  if (components?.length) {
    s += `**Componentes relacionados:** ${components.map((c) => `\`${c}\``).join(', ')}.\n\n`
  }
  if (flow) s += `**Fluxo:** ${flow}\n\n`
  if (tests?.length) {
    s += `**Testes:** ${tests.map((t) => `\`${t}\``).join(', ')}.\n\n`
  }
  if (notes) s += `**Observações:** ${notes}\n\n`
  s += '---\n\n'
  return s
}

const p = (...parts) => path.join(ROOT, ...parts)

let doc = `# Manual do Sistema SENAI HUB

> Documentação funcional e técnica completa da plataforma web \`Senai HUB/\`.
> Última geração automática de referências: ${new Date().toISOString().slice(0, 10)}.
> Para regenerar índices de linha após mudanças no código: \`node scripts/generate-system-manual.mjs\`.

---

## Índice

1. [Como usar este manual](#1-como-usar-este-manual)
2. [Visão geral da plataforma](#2-visão-geral-da-plataforma)
3. [Arquitetura técnica](#3-arquitetura-técnica)
4. [Modelo de dados (banco)](#4-modelo-de-dados-banco)
5. [Autenticação, papéis e permissões](#5-autenticação-papéis-e-permissões)
6. [Área pública e autenticação](#6-área-pública-e-autenticação)
7. [Módulo Hub](#7-módulo-hub)
8. [Módulo SENAI Connect](#8-módulo-senai-connect)
9. [Módulo SENAI Grid](#9-módulo-senai-grid)
10. [Módulo SENAI SAFE](#10-módulo-senai-safe)
11. [Recursos globais (transversais)](#11-recursos-globais-transversais)
12. [Relatórios personalizados](#12-relatórios-personalizados)
13. [Importação e exportação por planilhas](#13-importação-e-exportação-por-planilhas)
14. [Arquivo histórico](#14-arquivo-histórico)
15. [Testes automatizados](#15-testes-automatizados)
16. [Anexo A — Mapa completo de rotas API](#anexo-a--mapa-completo-de-rotas-api)
17. [Anexo B — Mapa de rotas do frontend](#anexo-b--mapa-de-rotas-do-frontend)
18. [Anexo C — Serviços backend](#anexo-c--serviços-backend)
19. [Anexo D — Serviços frontend](#anexo-d--serviços-frontend)
20. [Anexo E — Comandos Artisan](#anexo-e--comandos-artisan)
21. [Anexo F — Catálogo de planilhas](#anexo-f--catálogo-de-planilhas)
22. [Anexo G — Layouts e componentes estruturais](#anexo-g--layouts-e-componentes-estruturais)
23. [Seção 16 — Fluxos de negócio](#seção-16--fluxos-de-negócio)
24. [Apêndice — Roteiro de apresentação](#apêndice--roteiro-de-apresentação)

---

## 1. Como usar este manual

Cada funcionalidade está documentada com:

- **Descrição** do propósito e comportamento para o usuário.
- **Tabelas** do banco e entidades relacionadas.
- **Endpoints** REST consumidos pelo frontend.
- **Referências de código** com caminho e intervalo de linhas (backend e frontend).
- **Permissões** necessárias para acesso.
- **Testes** automatizados quando existirem.

Convenções:

- Caminhos relativos à pasta \`Senai HUB/\`.
- \`L10–L80\` = linhas 10 a 80 do arquivo indicado.
- Permissões no formato \`modulo.recurso.acao\`; o middleware aceita lista separada por vírgula (OR).

---

## 2. Visão geral da plataforma

O **SENAI HUB** centraliza quatro áreas em um único login:

| Área | Finalidade |
|---|---|
| **Hub** | Launcher de apps, usuários, perfil, configurações, arquivo histórico |
| **SENAI Connect** | Gestão acadêmica: pessoas, cursos, turmas, calendário, frequência, contratos, salários |
| **SENAI Grid** | Manutenção: chamados, tarefas Kanban, estoque, mapa, relatórios |
| **SENAI SAFE** | Autorizações de entrada/saída de alunos (AQV → professor → portaria) |

Recursos transversais: landing pública, solicitação de acesso, busca global (Ctrl+K), notificações, chat de suporte, temas/wallpapers, i18n (pt/en/es), relatórios customizados, planilhas CSV, arquivamento.

**Rotas principais:** ${ref(p('frontend/src/routes/index.tsx'), 66, 145)}

**API REST:** ${ref(p('backend/routes/api.php'), 1, 311)}

---

## 3. Arquitetura técnica

| Camada | Tecnologia | Pasta |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind, react-router, i18next | \`frontend/src/\` |
| Backend | Laravel, Sanctum, SQLite/MySQL | \`backend/\` |
| Autenticação | Bearer token (Sanctum) em \`localStorage\` | \`frontend/src/services/api.ts\`, \`AuthContext\` |
| Permissões | \`config/permissions.php\` + \`custom_permissions\` no usuário | \`backend/app/Services/Auth/PermissionService.php\` |

**Providers do App (ordem de montagem):** ${ref(p('frontend/src/App.tsx'), 14, 38)}

**Guards de rota:** \`ProtectedRoute\`, \`ModuleAccessRoute\`, \`PermissionRoute\`, \`AdminRoute\` em \`frontend/src/routes/\`.

---

## 4. Modelo de dados (banco)

### 4.1 Hub / compartilhado

| Tabela | Model | Descrição |
|---|---|---|
| \`users\` | \`User\` | Contas de login, papel, permissões customizadas, avatar |
| \`applications\` | \`Application\` | Apps exibidos no launcher (Connect, Grid, SAFE) |
| \`application_user\` | pivot | Apps liberados por usuário |
| \`hub_people\` | \`HubPerson\` | Cadastro unificado de pessoas (base de alunos/professores) |
| \`hub_notifications\` | \`HubNotification\` | Notificações in-app |
| \`access_requests\` | \`AccessRequest\` | Solicitações públicas de acesso |
| \`personal_access_tokens\` | Sanctum | Tokens de API |
| \`report_presets\` | \`ReportPreset\` | Presets de relatórios salvos |
| \`spreadsheet_import_logs\` | \`SpreadsheetImportLog\` | Log de importações CSV |

### 4.2 Connect

| Tabela | Model |
|---|---|
| \`connect_courses\` | \`ConnectCourse\` |
| \`connect_classes\` | \`ConnectClass\` |
| \`connect_students\` | \`ConnectStudent\` |
| \`connect_teachers\` | \`ConnectTeacher\` |
| \`connect_class_weekly_patterns\` | \`ConnectClassWeeklyPattern\` |
| \`connect_lesson_schedules\` | \`ConnectLessonSchedule\` |
| \`connect_attendance_sessions\` | \`ConnectAttendanceSession\` |
| \`connect_attendance_marks\` | \`ConnectAttendanceMark\` |
| \`connect_contracts\` | \`ConnectContract\` |
| \`connect_contract_attachments\` | \`ConnectContractAttachment\` |
| \`connect_salary_records\` | \`ConnectSalaryRecord\` |
| \`connect_student_locations\` | \`ConnectStudentLocation\` |
| \`connect_activities\` | \`ConnectActivity\` |
| \`connect_alerts\` | \`ConnectAlert\` |
| \`connect_course_hub_person\` | pivot curso↔pessoa |
| \`connect_class_hub_person\` | pivot turma↔pessoa |

### 4.3 Grid

| Tabela | Model |
|---|---|
| \`grid_tickets\` | \`GridTicket\` |
| \`grid_tasks\` | \`GridTask\` |
| \`grid_inventory_items\` | \`GridInventoryItem\` |
| \`grid_inventory_reservations\` | \`GridInventoryReservation\` |
| \`grid_users\` | \`GridUser\` |
| \`grid_ticket_attachments\` | \`GridTicketAttachment\` |

### 4.4 SAFE

| Tabela | Model |
|---|---|
| \`safe_students\` | \`SafeStudent\` (vínculo \`connect_student_id\`) |
| \`safe_authorizations\` | \`SafeAuthorization\` |
| \`safe_authorization_logs\` | \`SafeAuthorizationLog\` |

Migrations: \`backend/database/migrations/\` (29 arquivos).

---

## 5. Autenticação, papéis e permissões

**Configuração:** ${ref(p('backend/config/permissions.php'), 1, 336)}

**Serviço de permissões:** ${ref(p('backend/app/Services/Auth/PermissionService.php'), 1, 200)}

**Escopo de dados por usuário:** ${ref(p('backend/app/Support/UserAccessScope.php'), 1, 150)}

Papéis principais: \`admin\`, \`unassigned\`, \`connect_*\`, \`grid_*\`, \`safe_*\`. Admin possui \`*\`. Usuários com \`custom_permissions\` JSON substituem o pacote padrão do papel.

---

`

// === PUBLIC ===
doc += `## 6. Área pública e autenticação\n\n`

const publicFeatures = [
  ['PUB-01', 'Landing page', '/', null, 'Página institucional pública com hero, recursos, público-alvo e CTA para login.', [], [], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/LandingPage.tsx'), 1, 30) },
    { layer: 'Seções', ref: '`frontend/src/components/landing/*`' },
  ], 'components/landing/LandingHeader, LandingFooter, HubPreviewMockup'],
  ['PUB-02', 'Login', '/login', null, 'Autenticação email/senha; redireciona para /hub.', ['users', 'personal_access_tokens'], ['POST /auth/login'], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/LoginPage.tsx'), 1, 105) },
    { layer: 'Service', ref: ref(p('frontend/src/services/authService.ts'), 1, 80) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/AuthController.php'), 23, 36) },
    { layer: 'Service BE', ref: ref(p('backend/app/Services/Auth/AuthService.php'), 1, 120) },
  ], null, 'tests/Feature/AuthFeatureTest.php'],
  ['PUB-03', 'Recuperar senha', '/recuperar-senha', null, 'Envia e-mail com link de redefinição.', ['users', 'password_reset_tokens'], ['POST /auth/forgot-password'], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/ForgotPasswordPage.tsx'), 1, 73) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/AuthController.php'), 38, 45) },
  ]],
  ['PUB-04', 'Redefinir senha', '/redefinir-senha', null, 'Define nova senha a partir do token do e-mail.', ['password_reset_tokens'], ['POST /auth/reset-password'], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/ResetPasswordPage.tsx'), 1, 104) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/AuthController.php'), 47, 54) },
  ]],
  ['PUB-05', 'Solicitar acesso', '/solicitar-acesso', null, 'Formulário público; cria registro pendente e notifica admins.', ['access_requests'], ['POST /access-requests'], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/RequestAccessPage.tsx'), 1, 106) },
    { layer: 'Service', ref: ref(p('frontend/src/services/accessRequestService.ts'), 1, 30) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/AccessRequestController.php'), 13, 35) },
  ], null, 'tests/Feature/AccessRequestTest.php'],
  ['PUB-06', 'Health check API', null, null, 'Endpoint de saúde para monitoramento (DB, cache).', [], ['GET /health'], [
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/HealthController.php'), 15, 18) },
    { layer: 'Componente UI', ref: ref(p('frontend/src/components/layout/HealthStatusBadge.tsx'), 1, 60) },
  ], null, 'tests/Feature/HealthCheckTest.php'],
  ['PUB-07', 'Config pública (mapa)', null, null, 'Blocos e parâmetros do mapa do campus (sem auth).', [], ['GET /public-config'], [
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/PublicConfigController.php'), 10, 18) },
    { layer: 'Hook', ref: ref(p('frontend/src/hooks/usePublicConfig.ts'), 1, 40) },
  ]],
  ['PUB-08', 'Página 404', '*', null, 'Rota não encontrada.', [], [], [
    { layer: 'Página', ref: ref(p('frontend/src/pages/NotFoundPage.tsx'), 1, 26) },
  ]],
]

for (const [id, title, route, perm, desc, tables, eps, files, comps, test] of publicFeatures) {
  doc += feature({
    id, title, module: 'Público', route, permission: perm, description: desc,
    tables, endpoints: eps, files, components: comps ? [comps] : undefined, tests: test ? [test] : undefined,
  })
}

// Helper to batch more features - I'll append hub, connect, grid, safe, global in the script

doc += `## 7. Módulo Hub\n\n`

doc += feature({
  id: 'HUB-01', title: 'Launcher de aplicações', module: 'Hub', route: '/hub',
  permission: 'Autenticado',
  description: 'Tela inicial após login: cards das aplicações (Connect, Grid, SAFE) conforme permissões do usuário. Usuários sem apps veem painel de acesso pendente.',
  tables: ['applications', 'application_user', 'users'],
  endpoints: ['GET /applications'],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/ApplicationHubPage.tsx'), 11, 67) },
    { layer: 'Componente', ref: ref(p('frontend/src/components/hub/ApplicationCard.tsx'), 1, 80) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/ApplicationController.php'), 12, 23) },
  ],
})

doc += feature({
  id: 'HUB-02', title: 'Gestão de usuários (admin)', module: 'Hub', route: '/hub/usuarios',
  permission: 'admin',
  description: 'CRUD de usuários, atribuição de papel, permissões customizadas de navegação e sincronização de apps.',
  tables: ['users', 'application_user'],
  endpoints: ['GET/POST/PUT/DELETE /admin/users', 'GET /admin/roles', 'GET /admin/nav-permissions'],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/hub/HubUsersPage.tsx'), 86, 459) },
    { layer: 'Service', ref: ref(p('frontend/src/services/adminService.ts'), 1, 100) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/Admin/UserManagementController.php'), 18, 165) },
  ],
  tests: ['backend/tests/Feature/AdminUserManagementTest.php'],
})

doc += feature({
  id: 'HUB-03', title: 'Perfil do usuário', module: 'Hub', route: '/perfil',
  permission: 'Autenticado',
  description: 'Edição de nome/e-mail, troca de senha, upload/remoção de avatar, visualização de permissões e apps, logout.',
  tables: ['users'],
  endpoints: ['GET /auth/me', 'PUT /auth/me', 'PUT /auth/password', 'POST/DELETE /auth/avatar', 'POST /auth/logout'],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/ProfilePage.tsx'), 145, 921) },
    { layer: 'Context', ref: ref(p('frontend/src/contexts/AuthContext.tsx'), 1, 224) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/AuthController.php'), 56, 131) },
  ],
})

doc += feature({
  id: 'HUB-04', title: 'Configurações', module: 'Hub', route: '/configuracoes',
  permission: 'Autenticado',
  description: 'Idioma, aparência (atalho), preferências de notificação, redução de movimento, links rápidos.',
  tables: ['users (notification_preferences)'],
  endpoints: ['GET/PUT /auth/notification-preferences'],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/SettingsPage.tsx'), 77, 342) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/NotificationController.php'), 82, 112) },
  ],
})

doc += feature({
  id: 'HUB-05', title: 'Temas e wallpapers', module: 'Hub', route: '/temas',
  permission: 'Autenticado',
  description: 'Personalização visual do plano de fundo (presets ou imagem customizada); tom claro/escuro derivado do wallpaper. Persistência em localStorage.',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/ThemesPage.tsx'), 1, 19) },
    { layer: 'Context', ref: ref(p('frontend/src/contexts/AppearanceContext.tsx'), 1, 120) },
    { layer: 'Constantes', ref: ref(p('frontend/src/constants/wallpapers.ts'), 1, 380) },
    { layer: 'Componente', ref: ref(p('frontend/src/components/settings/AppearanceSettings.tsx'), 1, 200) },
  ],
  notes: 'Sem persistência no backend — apenas cliente.',
})

doc += feature({
  id: 'HUB-06', title: 'Acesso negado', module: 'Hub', route: '/acesso-negado',
  permission: 'Autenticado',
  description: 'Exibida quando o usuário não possui permissão para a rota solicitada.',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/AccessDeniedPage.tsx'), 1, 32) },
    { layer: 'Guard', ref: ref(p('frontend/src/routes/PermissionRoute.tsx'), 1, 80) },
  ],
})

// CONNECT - all features
doc += `## 8. Módulo SENAI Connect\n\n`
doc += `Permissão base do módulo: \`connect.access\`. Layout: \`frontend/src/layouts/ConnectLayout.tsx\`, sidebar: \`components/connect/ConnectSidebar.tsx\`.\n\n`

const connectFeatures = [
  ['CON-01', 'Dashboard Connect', '/connect', 'connect.dashboard', 'KPIs, gráficos de frequência, sessões por professor, alunos por curso, atividades e alertas.', ['connect_students', 'connect_teachers', 'connect_classes', 'connect_attendance_marks', 'connect_activities', 'connect_alerts'], ['GET /connect/dashboard'], 'ConnectOverviewPage.tsx', 'DashboardController.php', 'ConnectCharts.tsx (AttendanceDonutChart, QuickReportsSection)', ''],
  ['CON-02', 'Pessoas (cadastro unificado)', '/connect/pessoas', 'connect.people.manage', 'CRUD de hub_people — base para alunos e professores.', ['hub_people'], ['GET/POST/PUT/DELETE /connect/people'], 'PeoplePage.tsx', 'PersonController.php', 'ConnectEntityViewDrawer', ''],
  ['CON-03', 'Alunos', '/connect/alunos', 'connect.students.view|manage', 'Matrícula de alunos, vínculo com turma, perfil acadêmico.', ['connect_students', 'hub_people', 'connect_classes', 'connect_class_hub_person'], ['GET/POST/PUT/DELETE /connect/students'], 'StudentsPage.tsx', 'StudentController.php', 'ConnectEnrollmentService', 'ConnectAccessScopeTest'],
  ['CON-04', 'Professores', '/connect/professores', 'connect.teachers.view|manage', 'Cadastro de professores e especialidades.', ['connect_teachers', 'hub_people'], ['GET/POST/PUT/DELETE /connect/teachers'], 'TeachersPage.tsx', 'TeacherController.php', '', ''],
  ['CON-05', 'Turmas', '/connect/turmas', 'connect.classes.view|manage', 'CRUD de turmas, padrões semanais, geração de calendário e provisão de frequência.', ['connect_classes', 'connect_class_weekly_patterns', 'connect_lesson_schedules'], ['GET/POST/PUT/DELETE /connect/classes', 'roster endpoints'], 'ClassesPage.tsx', 'ClassController.php', 'ConnectScheduleService, ClassSchedulePanel', 'ConnectScheduleTest'],
  ['CON-06', 'Cursos', '/connect/cursos', 'connect.courses.view|manage', 'CRUD de cursos; ao criar/atualizar provisiona calendário padrão do semestre.', ['connect_courses', 'connect_lesson_schedules'], ['GET/POST/PUT/DELETE /connect/courses', 'roster'], 'CoursesPage.tsx', 'CourseController.php', 'ConnectRosterDrawer, ConnectSemesterDefaults', 'ConnectCourseCalendarProvisionTest, ConnectCourseDeleteTest'],
  ['CON-07', 'Calendário de aulas', '/connect/calendario', 'connect.calendar.view|manage', 'Visualização mês/semana; CRUD de aulas; integração com padrões semanais.', ['connect_lesson_schedules', 'connect_attendance_sessions'], ['GET /connect/calendar', 'POST/PUT/DELETE /connect/calendar/lessons'], 'CalendarPage.tsx', 'CalendarController.php', 'CalendarWeekGrid', 'ConnectScheduleTest'],
  ['CON-08', 'Frequência (chamada)', '/connect/frequencia', 'connect.attendance.view|manage', 'Registro de presença/falta por aula; export CSV.', ['connect_attendance_sessions', 'connect_attendance_marks'], ['GET /connect/attendance/session', 'POST .../marks'], 'AttendancePage.tsx', 'AttendanceController.php', 'ConnectAttendanceService', 'ConnectAttendanceSessionTest'],
  ['CON-09', 'Gerenciar frequência', '/connect/gerenciar-frequencia', 'connect.attendance.view|manage', 'Histórico paginado de sessões de chamada e resumos.', ['connect_attendance_sessions'], ['GET /connect/attendance/records', 'class-summary', 'student-summary'], 'AttendanceManagePage.tsx', 'AttendanceManageController.php', '', ''],
  ['CON-10', 'Relatório resumido Connect', '/connect/relatorio (aba resumo)', 'connect.reports.view', 'Indicadores acadêmicos pré-definidos; export XLSX/PDF via HTML.', ['várias connect_*'], ['GET /connect/reports/summary', 'summary/xlsx'], 'ConnectReportsPage.tsx', 'ReportController.php', 'printHtmlDocument', ''],
  ['CON-11', 'Relatórios customizados Connect', '/connect/relatorio (builder)', 'connect.reports.view|manage', 'Construtor de relatórios com seções, filtros, presets e export multi-formato.', ['report_presets', 'várias connect_*'], ['/reports/connect/*'], 'CustomReportBuilder.tsx', 'CustomReportController.php', 'ConnectReportBuilderService', ''],
  ['CON-12', 'Localização / mapa campus', '/connect/localizacao', 'connect.location.view', 'Mapa 2D/3D do campus; posição simulada ou real de alunos.', ['connect_student_locations', 'connect_students'], ['GET /connect/locations', '/connect/campus-people'], 'LocationPage.tsx', 'LocationController.php, CampusMapController.php', 'CampusMapContainer, CampusMap3DViewer', 'CampusMapTest'],
  ['CON-13', 'Contratos de alunos', '/connect/contratos/alunos', 'connect.contracts.*', 'Contratos de estágio/aprendizagem; anexos por aluno; PDF padrão com lacunas.', ['connect_contracts', 'connect_contract_attachments'], ['GET/POST/PUT/DELETE /connect/contracts', 'attachments', 'generate-document'], 'ContractsPage.tsx', 'ContractController.php', 'ConnectContractAttachmentsPanel, ConnectContractDocumentService', 'ConnectContractAttachmentTest'],
  ['CON-14', 'Salário Jovem Aprendiz', '/connect/salario', 'connect.salary.view', 'Preview, cálculo individual/lote, histórico com base em frequência e contrato.', ['connect_salary_records', 'connect_attendance_marks'], ['GET /connect/salaries', 'preview', 'calculate'], 'SalaryPage.tsx', 'SalaryController.php', '', ''],
  ['CON-15', 'Planilhas Connect', '/connect/planilhas', 'connect.spreadsheets', 'Template, export, preview e import CSV de entidades Connect.', ['spreadsheet_import_logs'], ['/spreadsheets/connect/*'], 'SpreadsheetHubPage.tsx', 'SpreadsheetController.php', 'ConnectSpreadsheetHandler', 'SpreadsheetImportExportTest'],
  ['CON-16', 'Perfis unificados (drawer)', 'várias telas', 'conforme entidade', 'Visualização read-only de perfil de aluno, professor, turma, curso, pessoa, contrato.', ['hub_people', 'connect_students', 'connect_teachers', 'connect_classes', 'connect_courses', 'connect_contracts'], ['GET /connect/*/profile'], 'ConnectEntityViewDrawer.tsx', 'ProfileController.php', '', ''],
  ['CON-17', 'Roster de curso/turma', 'Cursos/Turmas', 'connect.courses.manage|classes.manage', 'Matrícula individual ou importação de turma inteira no curso.', ['connect_course_hub_person', 'connect_class_hub_person'], ['roster endpoints'], 'ConnectRosterDrawer.tsx', 'CourseRosterController.php, ClassRosterController.php', 'ConnectEnrollmentService', 'ConnectCourseRosterFromClassTest'],
]

for (const row of connectFeatures) {
  const [id, title, route, perm, desc, tables, eps, fePage, beCtrl, comps, test] = row
  const pagePath = p('frontend/src/pages/connect', fePage.includes('/') ? '' : fePage)
  const actualPage = fePage.includes('.tsx') && !fePage.includes('/')
    ? p('frontend/src/pages/connect', fePage)
    : fePage.startsWith('Custom') || fePage.startsWith('ConnectEntity') || fePage.startsWith('ConnectRoster')
      ? p('frontend/src/components/connect', fePage)
      : p('frontend/src/pages/connect', fePage)
  const ctrlPath = p('backend/app/Http/Controllers/Api/Connect', beCtrl)
  doc += feature({
    id, title, module: 'Connect', route, permission: perm, description: desc,
    tables, endpoints: eps,
    files: [
      { layer: 'Frontend', ref: ref(actualPage, 1, linesOf(actualPage)) },
      { layer: 'Backend', ref: ref(ctrlPath, 1, linesOf(ctrlPath)) },
    ],
    components: comps ? comps.split(', ') : undefined,
    tests: test ? [`backend/tests/Feature/${test}.php`] : undefined,
  })
}

// GRID
doc += `## 9. Módulo SENAI Grid\n\n`

const gridFeatures = [
  ['GRD-01', 'Dashboard Grid', '/grid', 'grid.dashboard', 'KPIs de chamados, tarefas, estoque; gráficos e lista recente.', ['grid_tickets', 'grid_tasks', 'grid_inventory_items'], ['GET /grid/dashboard'], 'GridDashboardPage.tsx', 'Grid/DashboardController.php', 'GridCharts', ''],
  ['GRD-02', 'Chamados (Kanban)', '/grid/chamados', 'grid.tickets.view|manage', 'Lista/Kanban de chamados; criar, atribuir, transições de status, anexos, avaliação.', ['grid_tickets', 'grid_ticket_attachments'], ['GET/POST/PUT/DELETE /grid/tickets', 'approve-service', 'evaluate', 'tasks'], 'GridTicketsPage.tsx', 'Grid/TicketController.php', 'GridWorkflowService, GridTicketAttachmentsPanel', ''],
  ['GRD-03', 'Controle de chamados', '/grid/controle', 'grid.controle', 'Console operacional: detalhe do chamado, workflow, relatório, anexos.', ['grid_tickets'], ['GET /grid/tickets/{id}', 'report'], 'GridTicketControlPage.tsx', 'Grid/TicketController.php', 'GridTicketControlPanel', ''],
  ['GRD-04', 'Tarefas Kanban', '/grid/tarefas', 'grid.tasks.manage', 'Board de tarefas com colunas; reserva de materiais do estoque.', ['grid_tasks', 'grid_inventory_reservations'], ['GET/POST/PUT/DELETE /grid/tasks'], 'GridTasksPage.tsx', 'Grid/TaskController.php', 'GridWorkflowService', ''],
  ['GRD-05', 'Relatórios Grid', '/grid/relatorios', 'grid.reports.view', 'KPIs + construtor de relatórios customizados do módulo Grid.', ['report_presets', 'grid_*'], ['/reports/grid/*', 'GET /grid/tickets'], 'GridReportsPage.tsx', 'CustomReportController.php', 'GridReportBuilderService', ''],
  ['GRD-06', 'Estoque', '/grid/estoque', 'grid.inventory.view|manage', 'CRUD de itens, ajuste de quantidade, upload/sync de imagem, alerta de estoque baixo.', ['grid_inventory_items'], ['GET/POST/PUT/DELETE /grid/inventory', 'adjust', 'image', 'sync-image'], 'GridInventoryPage.tsx', 'Grid/InventoryController.php', 'InventoryImageResolver, InventoryDuplicateService', 'InventoryDuplicateServiceTest (unit)'],
  ['GRD-07', 'Mapa de tarefas', '/grid/mapa', 'grid.tasks.map', 'Mapa do campus com chamados/tarefas abertos sobrepostos.', ['grid_tasks', 'grid_tickets'], ['GET /grid/tasks', 'GET /public-config'], 'GridTaskMapPage.tsx', 'Grid/TaskController.php', 'CampusMapContainer', ''],
  ['GRD-08', 'Usuários Grid', '/grid/usuarios', 'grid.users.manage', 'Técnicos e equipe de manutenção (grid_users).', ['grid_users', 'hub_people'], ['GET/POST/PUT/DELETE /grid/users'], 'GridUsersPage.tsx', 'Grid/UserController.php', '', 'GridAccessScopeTest'],
  ['GRD-09', 'Planilhas Grid', '/grid/planilhas', 'grid.spreadsheets', 'Import/export CSV de tickets e estoque.', ['spreadsheet_import_logs'], ['/spreadsheets/grid/*'], 'SpreadsheetHubPage.tsx', 'SpreadsheetController.php', 'GridSpreadsheetHandler', 'SpreadsheetImportExportTest'],
]

for (const row of gridFeatures) {
  const [id, title, route, perm, desc, tables, eps, fePage, beCtrl, comps, test] = row
  const actualPage = p('frontend/src/pages/grid', fePage)
  const ctrlPath = p('backend/app/Http/Controllers/Api', beCtrl)
  doc += feature({
    id, title, module: 'Grid', route, permission: perm, description: desc,
    tables, endpoints: eps,
    files: [
      { layer: 'Frontend', ref: ref(actualPage, 1, linesOf(actualPage)) },
      { layer: 'Backend', ref: ref(ctrlPath, 1, linesOf(ctrlPath)) },
    ],
    components: comps ? comps.split(', ') : undefined,
    tests: test ? [test.includes('/') ? test : `backend/tests/Feature/${test}.php`] : undefined,
  })
}

// SAFE
doc += `## 10. Módulo SENAI SAFE\n\n`

const safeFeatures = [
  ['SAF-01', 'Dashboard SAFE', '/safe', 'safe.dashboard', 'Painel conforme papel: AQV, professor ou portaria; filas e KPIs.', ['safe_authorizations'], ['GET /safe/dashboard'], 'SafeDashboardPage.tsx', 'Safe/DashboardController.php', '', 'SafeModuleTest'],
  ['SAF-02', 'Alunos SAFE', '/safe/alunos', 'safe.students.manage', 'Listagem somente leitura espelhada do Connect; CRUD bloqueado no SAFE.', ['safe_students', 'connect_students'], ['GET /safe/students'], 'SafeStudentsPage.tsx', 'Safe/StudentController.php', 'SafeConnectStudentBridge', 'SafeConnectStudentsTest'],
  ['SAF-03', 'Autorizações (AQV)', '/safe/autorizacoes', 'safe.authorizations.manage', 'Criar e editar solicitações de entrada/saída; histórico de auditoria.', ['safe_authorizations', 'safe_authorization_logs'], ['GET/POST/PUT /safe/authorizations', 'history'], 'SafeAuthorizationsPage.tsx', 'Safe/AuthorizationController.php', 'SafeWorkflowService', 'SafeWorkflowTest'],
  ['SAF-04', 'Detalhe da autorização', '/safe/autorizacoes/:id', 'safe.authorizations.manage', 'Timeline de eventos e dados completos do protocolo.', ['safe_authorization_logs'], ['GET /safe/authorizations/{id}/history'], 'SafeAuthorizationDetailPage.tsx', 'Safe/AuthorizationController.php', '', ''],
  ['SAF-05', 'Aprovações (professor)', '/safe/aprovacoes', 'safe.approve', 'Fila de autorizações pendentes para aprovar ou negar.', ['safe_authorizations'], ['GET /safe/teacher/authorizations', 'approve', 'deny'], 'SafeApprovalsPage.tsx', 'Safe/TeacherController.php', 'SafeWorkflowService', 'SafeWorkflowTest'],
  ['SAF-06', 'Portaria', '/safe/portaria', 'safe.portaria', 'Confirmação física de saída/entrada na portaria.', ['safe_authorizations'], ['GET /safe/portaria/authorizations', 'confirm', 'deny'], 'SafePortariaPage.tsx', 'Safe/PortariaController.php', 'SafeWorkflowService', 'SafeWorkflowTest'],
]

for (const row of safeFeatures) {
  const [id, title, route, perm, desc, tables, eps, fePage, beCtrl, comps, test] = row
  doc += feature({
    id, title, module: 'SAFE', route, permission: perm, description: desc,
    tables, endpoints: eps,
    files: [
      { layer: 'Frontend', ref: ref(p('frontend/src/pages/safe', fePage), 1, linesOf(p('frontend/src/pages/safe', fePage))) },
      { layer: 'Backend', ref: ref(p('backend/app/Http/Controllers/Api', beCtrl), 1, linesOf(p('backend/app/Http/Controllers/Api', beCtrl))) },
    ],
    components: comps ? [comps] : undefined,
    tests: test ? [`backend/tests/Feature/${test}.php`] : undefined,
    flow: id === 'SAF-03' ? 'AQV cria → professor aprova/nega → (se saída) portaria confirma → finalizado/arquivado.' : undefined,
  })
}

// GLOBAL
doc += `## 11. Recursos globais (transversais)\n\n`

doc += feature({
  id: 'GLB-01', title: 'Busca global (Ctrl+K)', module: 'Global', route: 'Qualquer tela autenticada',
  permission: 'Autenticado (resultados filtrados por permissão)',
  description: 'Paleta de busca unificada: alunos, turmas, chamados, estoque. Debounce 250ms, mínimo 2 caracteres.',
  tables: ['connect_students', 'connect_classes', 'grid_tickets', 'grid_inventory_items'],
  endpoints: ['GET /search?q='],
  files: [
    { layer: 'Context', ref: ref(p('frontend/src/contexts/GlobalSearchContext.tsx'), 1, 80) },
    { layer: 'UI', ref: ref(p('frontend/src/components/search/GlobalSearchPalette.tsx'), 1, 200) },
    { layer: 'Service BE', ref: ref(p('backend/app/Services/Search/GlobalSearchService.php'), 1, 150) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/GlobalSearchController.php'), 16, 25) },
  ],
})

doc += feature({
  id: 'GLB-02', title: 'Notificações in-app', module: 'Global', route: 'Sino no header',
  permission: 'Autenticado',
  description: 'Bell com contagem não lida (poll 45s); marcar lida; e-mail conforme preferências.',
  tables: ['hub_notifications', 'users.notification_preferences'],
  endpoints: ['GET /notifications', 'unread-count', 'PATCH read', 'read-all', 'DELETE'],
  files: [
    { layer: 'Context', ref: ref(p('frontend/src/contexts/NotificationContext.tsx'), 1, 120) },
    { layer: 'UI', ref: ref(p('frontend/src/components/notifications/NotificationBell.tsx'), 1, 150) },
    { layer: 'Service BE', ref: ref(p('backend/app/Services/Notification/NotificationService.php'), 1, 200) },
    { layer: 'Triggers', ref: ref(p('backend/app/Services/Notification/SystemNotificationTriggers.php'), 1, 300) },
  ],
  tests: ['backend/tests/Feature/NotificationTest.php'],
})

doc += feature({
  id: 'GLB-03', title: 'Chat de suporte', module: 'Global', route: 'Botão Suporte nas sidebars',
  permission: 'Autenticado / público (landing)',
  description: 'Widget flutuante estilo messenger; mensagens locais com resposta automática placeholder (IA futura).',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Context', ref: ref(p('frontend/src/contexts/SupportChatContext.tsx'), 1, 120) },
    { layer: 'Widget', ref: ref(p('frontend/src/components/support/SupportChatWidget.tsx'), 1, 180) },
    { layer: 'Trigger', ref: ref(p('frontend/src/components/support/SupportChatTrigger.tsx'), 1, 30) },
  ],
  notes: 'Sem backend ainda — integração futura via SupportChatContext.sendMessage.',
})

doc += feature({
  id: 'GLB-04', title: 'Internacionalização (i18n)', module: 'Global', route: 'Todas as telas',
  permission: '—',
  description: 'Português (padrão), inglês e espanhol; locales base + supplement JSON.',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Config', ref: ref(p('frontend/src/i18n/index.ts'), 1, 80) },
    { layer: 'Locales', ref: '`frontend/src/i18n/locales/*.json` e `supplement/*.json`' },
    { layer: 'UI', ref: ref(p('frontend/src/components/settings/LanguageSwitcher.tsx'), 1, 60) },
  ],
})

doc += feature({
  id: 'GLB-05', title: 'Identidade visual / logos', module: 'Global', route: '—',
  permission: '—',
  description: 'Pacote de logos por app: expanded, icon, mark-light, mark-dark. Script de sincronização SAFE/HUB.',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Assets', ref: ref(p('frontend/src/assets/brand/index.ts'), 1, 40) },
    { layer: 'Util', ref: ref(p('frontend/src/utils/appBrandAssets.ts'), 1, 130) },
    { layer: 'Script', ref: ref(p('frontend/scripts/sync-brand-assets.mjs'), 1, 50) },
    { layer: 'Regra', ref: ref(p('.cursor/rules/senai-hub-brand.mdc'), 1, 50) },
  ],
})

doc += feature({
  id: 'GLB-06', title: 'Toast e confirmações', module: 'Global', route: '—',
  permission: '—',
  description: 'Feedback de sucesso/erro e diálogos de confirmação para ações destrutivas.',
  tables: [],
  endpoints: [],
  files: [
    { layer: 'Toast', ref: ref(p('frontend/src/contexts/ToastContext.tsx'), 1, 97) },
    { layer: 'Confirm', ref: ref(p('frontend/src/contexts/ConfirmContext.tsx'), 1, 80) },
    { layer: 'Hook', ref: ref(p('frontend/src/hooks/useCrudToast.ts'), 1, 40) },
  ],
})

// Reports section
doc += `## 12. Relatórios personalizados\n\n`
doc += `Módulos: **connect** e **grid**. Builder compartilhado: ${ref(p('frontend/src/components/reports/CustomReportBuilder.tsx'), 45, 610)}.\n\n`
doc += `- Schema e seções: \`backend/app/Support/Reports/ReportSchemaRegistry.php\`\n`
doc += `- Builders: \`ConnectReportBuilderService.php\`, \`GridReportBuilderService.php\`\n`
doc += `- Export: CSV, XLSX, JSON, HTML (PDF via impressão do navegador — \`openHtmlInNewTab\` em \`frontend/src/utils/downloadFile.ts\`)\n`
doc += `- Template impressão: \`backend/resources/views/reports/print.blade.php\`\n\n`

// Spreadsheets
doc += `## 13. Importação e exportação por planilhas\n\n`
doc += `| Módulo | Chaves (\`spreadsheet_key\`) | Handler |\n|---|---|---|\n`
doc += `| Connect | students, teachers, classes, courses, attendance, contracts, ... | \`ConnectSpreadsheetHandler.php\` |\n`
doc += `| Grid | tickets, inventory | \`GridSpreadsheetHandler.php\` |\n\n`
doc += `Orquestração: ${ref(p('backend/app/Services/Spreadsheet/SpreadsheetService.php'), 1, 200)}. UI: ${ref(p('frontend/src/pages/spreadsheet/SpreadsheetHubPage.tsx'), 24, 346)}.\n\n`

// Archive
doc += `## 14. Arquivo histórico\n\n`
doc += feature({
  id: 'ARC-01', title: 'Arquivo histórico Hub', module: 'Hub', route: '/hub/arquivo',
  permission: 'connect.classes.view | grid.tickets.view | safe.access (conforme aba)',
  description: 'Consulta turmas encerradas, chamados concluídos e autorizações SAFE finalizadas; arquivamento automático de turmas com data fim vencida.',
  tables: ['connect_classes', 'grid_tickets', 'safe_authorizations'],
  endpoints: ['GET /archive/summary', 'connect/classes', 'grid/tickets', 'safe/authorizations', 'POST /archive/run-auto-archive'],
  files: [
    { layer: 'Página', ref: ref(p('frontend/src/pages/hub/HubArchivePage.tsx'), 30, 394) },
    { layer: 'Service', ref: ref(p('frontend/src/services/archiveService.ts'), 1, 80) },
    { layer: 'Controller', ref: ref(p('backend/app/Http/Controllers/Api/ArchiveController.php'), 27, 155) },
    { layer: 'Service BE', ref: ref(p('backend/app/Services/Connect/ConnectClassArchiveService.php'), 1, 100) },
  ],
  tests: ['backend/tests/Feature/ArchiveTest.php'],
})

// Tests
doc += `## 15. Testes automatizados\n\n`
doc += `| Arquivo | Escopo |\n|---|---|\n`
const tests = fs.readdirSync(p('backend/tests/Feature')).filter((f) => f.endsWith('.php'))
for (const t of tests.sort()) doc += `| \`backend/tests/Feature/${t}\` | Feature |\n`
const unitTests = fs.readdirSync(p('backend/tests/Unit')).filter((f) => f.endsWith('.php'))
for (const t of unitTests.sort()) doc += `| \`backend/tests/Unit/${t}\` | Unit |\n`
doc += '\n'

// Annex A - API routes from file
doc += `## Anexo A — Mapa completo de rotas API\n\n`
doc += `Fonte: ${ref(p('backend/routes/api.php'), 54, 311)}\n\n`
doc += '```\n'
doc += fs.readFileSync(p('backend/routes/api.php'), 'utf8').split('\n').filter((l) => l.includes('Route::')).join('\n')
doc += '\n```\n\n'

// Annex B
doc += `## Anexo B — Mapa de rotas do frontend\n\n`
doc += `Fonte: ${ref(p('frontend/src/routes/index.tsx'), 66, 145)}\n\n`
doc += '| Rota | Página |\n|---|---|\n'
const routeLines = fs.readFileSync(p('frontend/src/routes/index.tsx'), 'utf8').split('\n')
for (const line of routeLines) {
  const m = line.match(/path="([^"]+)".*element=\{<(\w+)/)
  if (m) doc += `| \`${m[1]}\` | \`${m[2]}\` |\n`
}
const lazyMatches = [...fs.readFileSync(p('frontend/src/routes/index.tsx'), 'utf8').matchAll(/path="([^"]+)".*<(LazyPage|SpreadsheetHubPage)/g)]
doc += '\n'

// Annex C - services list
doc += `## Anexo C — Serviços backend\n\n`
function walkServices(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) walkServices(full, acc)
    else if (ent.name.endsWith('.php')) acc.push(full)
  }
  return acc
}
const services = walkServices(p('backend/app/Services'))
for (const s of services.sort()) {
  const content = fs.readFileSync(s, 'utf8')
  const methods = [...content.matchAll(/public function (\w+)/g)].map((m) => m[1]).slice(0, 12)
  doc += `### \`${rel(s)}\` (${linesOf(s)} linhas)\n`
  doc += `Métodos públicos: ${methods.join(', ')}${methods.length >= 12 ? ', …' : ''}\n\n`
}

// Section 16 - Business flows
doc += `## Seção 16 — Fluxos de negócio\n\n`

doc += `### Fluxo acadêmico Connect\n\n`
doc += `\`\`\`text\nPessoa (hub_people)\n  → Aluno/Professor (connect_students / connect_teachers)\n  → Curso + Turma (connect_courses / connect_classes)\n  → Padrão semanal (connect_class_weekly_patterns)\n  → Aulas (connect_lesson_schedules)\n  → Sessão de frequência (connect_attendance_sessions)\n  → Marcações (connect_attendance_marks)\n  → Contrato (connect_contracts) → Salário (connect_salary_records)\n\`\`\`\n\n`
doc += `Serviços: \`ConnectEnrollmentService\`, \`ConnectScheduleService\`, \`ConnectAttendanceService\`.\n\n`

doc += `### Fluxo de chamado Grid\n\n`
doc += `\`\`\`text\nAberto → Em atendimento → Aguardando aprovação → Em avaliação → Concluído\n         ↘ Tarefas Kanban (grid_tasks) + reservas de estoque (grid_inventory_reservations)\n\`\`\`\n\n`
doc += `Implementação: \`GridWorkflowService.php\` (L1–L619). Status em \`grid_tickets.status\`.\n\n`

doc += `### Fluxo SAFE (autorização)\n\n`
doc += `\`\`\`text\nAQV cria (pendente)\n  → Professor aprova → (saída) aguarda portaria → portaria confirma → finalizado\n  → Professor nega → negado\n  → Portaria nega na saída → negado\n\`\`\`\n\n`
doc += `Implementação: \`SafeWorkflowService.php\` (L1–L260). Auditoria em \`safe_authorization_logs\`.\n\n`

// Sub-features not tied to single pages
doc += `### Funcionalidades complementares (subtelas e painéis)\n\n`

const subFeatures = [
  ['SUB-01', 'Painel acesso pendente', 'Hub', '/hub', 'Usuário unassigned vê instruções até admin liberar apps.', 'components/hub/PendingAccessPanel.tsx'],
  ['SUB-02', 'Aba cadastros no dashboard Connect', 'Connect', '/connect', 'Tabela de alunos recém-cadastrados.', 'ConnectOverviewPage.tsx (tab cadastros)'],
  ['SUB-03', 'Aba alertas no dashboard Connect', 'Connect', '/connect', 'Alertas operacionais do Connect.', 'connect_alerts', 'ConnectOverviewPage.tsx'],
  ['SUB-04', 'Gráfico frequência (donut)', 'Connect', '/connect', 'Distribuição presente/FJ/FI; total_records real.', 'ConnectCharts.tsx AttendanceDonutChart'],
  ['SUB-05', 'Gráfico sessões por professor', 'Connect', '/connect', 'Barras com aulas ministradas na semana.', 'ConnectCharts.tsx TeacherSessionsBarChart'],
  ['SUB-06', 'Gráfico alunos por curso', 'Connect', '/connect', 'Barras horizontais de matrículas.', 'ConnectCharts.tsx StudentsByCourseChart'],
  ['SUB-07', 'Painel padrão semanal da turma', 'Connect', 'Turmas/Calendário', 'Sincroniza padrões, gera calendário, provisiona frequência.', 'components/connect/ClassSchedulePanel.tsx'],
  ['SUB-08', 'Drawer aprovar serviço Grid', 'Grid', '/grid/chamados', 'Transição pós-execução técnica.', 'components/grid/GridApproveServiceDrawer.tsx'],
  ['SUB-09', 'Drawer avaliar chamado Grid', 'Grid', '/grid/chamados', 'Nota e comentário final.', 'components/grid/GridEvaluateTicketDrawer.tsx'],
  ['SUB-10', 'Drawer criar tarefa do chamado', 'Grid', '/grid/chamados', 'Kanban task + materiais.', 'components/grid/GridCreateTaskFromTicketDrawer.tsx'],
  ['SUB-11', 'Anexos de chamado Grid', 'Grid', '/grid', 'Upload/listagem de arquivos.', 'components/grid/GridTicketAttachmentsPanel.tsx'],
  ['SUB-12', 'Seletor de estoque em tarefas', 'Grid', '/grid/tarefas', 'Picker de itens com reserva.', 'components/grid/GridInventoryPicker.tsx'],
  ['SUB-13', 'Mapa 3D do campus', 'Connect/Grid', 'localização/mapa', 'Viewer Three.js do campus.', 'components/connect/CampusMap3DViewer.tsx'],
  ['SUB-14', 'E-mail transacional', 'Global', '—', 'Envio de e-mails de notificação e reset de senha.', 'Notification/HubMailDispatcher.php'],
  ['SUB-15', 'Template PDF contrato padrão', 'Connect', 'contratos', 'HTML/PDF com lacunas nome, curso, empresa.', 'resources/views/contracts/default.blade.php'],
  ['SUB-16', 'Provisionamento calendário semestre', 'Connect', 'cursos/turmas', 'Aulas padrão ao criar curso com período.', 'ConnectSemesterDefaults.php, ConnectScheduleService.php'],
]

for (const row of subFeatures) {
  const [id, title, mod, route, desc, ...rest] = row
  const file = rest[0]
  const abs = file.includes('/') ? p('frontend/src', file.replace('components/', 'components/')) : file.includes('.php') ? p('backend', file) : p('frontend/src/pages/connect', file)
  const actualPath = file.startsWith('Connect') || file.startsWith('connect_')
    ? p('frontend/src/pages/connect/ConnectOverviewPage.tsx')
    : file.includes('.php')
      ? p('backend', file.includes('/') ? file : `app/Services/${file}`)
      : file.includes('ConnectCharts') || file.includes('ClassSchedule') || file.includes('Grid') || file.includes('Campus')
        ? p('frontend/src/components', file.replace('components/', ''))
        : p('frontend/src/components/hub', file.replace('components/hub/', ''))
  doc += feature({
    id, title, module: mod, route, permission: '—',
    description: desc,
    files: fs.existsSync(actualPath) ? [{ layer: 'Código', ref: ref(actualPath, 1, linesOf(actualPath)) }] : [{ layer: 'Código', ref: `\`${file}\`` }],
  })
}

// Landing sections as separate entries
const landingSections = [
  ['PUB-01a', 'Hero landing', 'LandingHero.tsx'],
  ['PUB-01b', 'Recursos landing', 'LandingFeatures.tsx'],
  ['PUB-01c', 'Público-alvo landing', 'LandingAudience.tsx'],
  ['PUB-01d', 'Preview mockup Hub', 'HubPreviewMockup.tsx'],
  ['PUB-01e', 'CTA landing', 'LandingCta.tsx'],
]
doc += `### Seções da landing page (detalhe)\n\n`
for (const [id, title, file] of landingSections) {
  const fp = p('frontend/src/components/landing', file)
  doc += feature({
    id, title, module: 'Público', route: '/',
    description: `Seção da landing: ${title.replace(' landing', '')}.`,
    files: [{ layer: 'Componente', ref: ref(fp, 1, linesOf(fp)) }],
  })
}

// Anexo D - Frontend services
doc += `## Anexo D — Serviços frontend\n\n`
doc += `| Service | Arquivo | Responsabilidade |\n|---|---|---|\n`
const feServices = [
  ['api', 'Cliente Axios + interceptors 401', 'api.ts'],
  ['authService', 'Login, logout, perfil, senha, avatar', 'authService.ts'],
  ['applicationService', 'GET /applications', 'applicationService.ts'],
  ['adminService', 'CRUD usuários admin', 'adminService.ts'],
  ['connectService', 'Todas as APIs Connect', 'connectService.ts'],
  ['gridService', 'Todas as APIs Grid', 'gridService.ts'],
  ['safeService', 'Todas as APIs SAFE', 'safeService.ts'],
  ['archiveService', 'Arquivo histórico', 'archiveService.ts'],
  ['reportService', 'Relatórios customizados export', 'reportService.ts'],
  ['reportPresetService', 'Presets de relatório', 'reportPresetService.ts'],
  ['spreadsheetService', 'Import/export planilhas', 'spreadsheetService.ts'],
  ['notificationService', 'Notificações e preferências', 'notificationService.ts'],
  ['searchService', 'Busca global', 'searchService.ts'],
  ['accessRequestService', 'Solicitação de acesso', 'accessRequestService.ts'],
  ['publicConfigService', 'Config pública mapa', 'publicConfigService.ts'],
  ['healthService', 'Health check', 'healthService.ts'],
  ['permissionsCatalogService', 'Catálogo de permissões', 'permissionsCatalogService.ts'],
]
for (const [name, desc, file] of feServices) {
  const fp = p('frontend/src/services', file)
  doc += `| \`${name}\` | \`${rel(fp)}\` (${linesOf(fp)} linhas) | ${desc} |\n`
}
doc += '\n'

// Anexo E - Artisan
doc += `## Anexo E — Comandos Artisan\n\n`
doc += `| Comando | Arquivo | Função |\n|---|---|---|\n`
const commands = [
  ['connect:sync-class-schedules', 'SyncConnectClassSchedules.php', 'Sincroniza calendário de turmas'],
  ['connect:archive-expired-classes', 'ArchiveExpiredConnectClasses.php', 'Arquiva turmas com data fim vencida'],
  ['permissions:sync-frontend', 'SyncPermissionsFrontendCommand.php', 'Sincroniza permissões com frontend'],
  ['grid:merge-inventory-duplicates', 'MergeGridInventoryDuplicates.php', 'Mescla itens duplicados no estoque'],
  ['grid:sync-inventory-images', 'SyncGridInventoryImages.php', 'Busca imagens Wikimedia para estoque'],
  ['grid:purge-demo-data', 'PurgeGridDemoData.php', 'Remove dados demo do Grid'],
]
for (const [cmd, file, desc] of commands) {
  const fp = p('backend/app/Console/Commands', file)
  doc += `| \`php artisan ${cmd}\` | \`${rel(fp)}\` | ${desc} |\n`
}
doc += '\n'

// Anexo F - Spreadsheets
doc += `## Anexo F — Catálogo de planilhas\n\n`
doc += `Fonte: \`backend/app/Support/Spreadsheet/SpreadsheetRegistry.php\`.\n\n`
doc += `### Connect\n\n| key | Descrição | Import | Export |\n|---|---|---|---|\n`
doc += `| people | Pessoas (cadastro global) | sim | sim |\n`
doc += `| students | Alunos | sim | sim |\n`
doc += `| teachers | Professores | sim | sim |\n`
doc += `| courses | Cursos | sim | sim |\n`
doc += `| classes | Turmas | sim | sim |\n`
doc += `| contracts | Contratos | sim | sim |\n`
doc += `| attendance | Marcações de frequência | sim | sim |\n`
doc += `| attendance_sessions | Sessões de frequência | não | sim |\n\n`
doc += `### Grid\n\n| key | Descrição | Import | Export |\n|---|---|---|---|\n`
doc += `| users | Usuários Grid | sim | sim |\n`
doc += `| inventory | Estoque | sim | sim |\n`
doc += `| tickets | Chamados | sim | sim |\n\n`

// Anexo G - Layouts
doc += `## Anexo G — Layouts e componentes estruturais\n\n`
doc += `| Componente | Arquivo | Função |\n|---|---|---|\n`
const layouts = [
  ['HubLayout', 'layouts/HubLayout.tsx', 'Shell Hub + sidebar'],
  ['ConnectLayout', 'layouts/ConnectLayout.tsx', 'Shell Connect'],
  ['GridLayout', 'layouts/GridLayout.tsx', 'Shell Grid'],
  ['SafeLayout', 'components/safe/SafeLayout.tsx', 'Shell SAFE'],
  ['AuthLayout', 'layouts/AuthLayout.tsx', 'Telas de login'],
  ['GlassShell', 'components/layout/GlassShell.tsx', 'Fundo glass + wallpaper'],
  ['HubHeader', 'components/hub/HubHeader.tsx', 'Header Hub'],
  ['ConnectHeader', 'components/connect/ConnectHeader.tsx', 'Header Connect + busca'],
  ['GridHeader', 'components/grid/GridHeader.tsx', 'Header Grid'],
  ['SafeHeader', 'components/safe/SafeHeader.tsx', 'Header SAFE'],
  ['ProtectedRoute', 'routes/ProtectedRoute.tsx', 'Exige autenticação'],
  ['ModuleAccessRoute', 'routes/ModuleAccessRoute.tsx', 'Exige connect/grid/safe.access'],
  ['PermissionRoute', 'routes/PermissionRoute.tsx', 'Filtra por nav permission'],
  ['AdminRoute', 'routes/AdminRoute.tsx', 'Somente admin'],
]
for (const [name, file, desc] of layouts) {
  const fp = file.startsWith('routes/') ? p('frontend/src', file) : p('frontend/src', file.startsWith('layouts') ? file : file)
  const actual = p('frontend/src', file.replace('layouts/', 'layouts/').replace('components/', 'components/').replace('routes/', 'routes/'))
  doc += `| \`${name}\` | \`${rel(actual)}\` | ${desc} |\n`
}
doc += '\n'

// Presentation appendix
doc += `## Apêndice — Roteiro de apresentação\n\n`
doc += `### Abertura sugerida\n\n`
doc += `> O SENAI HUB é uma plataforma web que integra gestão acadêmica (Connect), manutenção (Grid) e controle de entrada/saída (SAFE). Login único com permissões por perfil. Frontend React/TypeScript, API Laravel/Sanctum.\n\n`
doc += `### Ordem de demonstração recomendada\n\n`
doc += `1. Landing pública → login\n2. Hub launcher → Connect dashboard\n3. Turma + calendário + frequência\n4. Grid chamado → tarefa → estoque\n5. SAFE autorização → aprovação → portaria\n6. Relatório PDF + planilha + arquivo histórico\n7. Perfil, temas, busca global, chat suporte\n\n`
doc += `### Perguntas frequentes\n\n`
doc += `- **É o mesmo backend do app mobile?** Não — o site usa Laravel; o app Expo usa Supabase (ver seção 3).\n`
doc += `- **Onde ficam os dados?** Migrations em \`backend/database/migrations/\`; SQLite em dev.\n`
doc += `- **Como adicionar permissão?** \`config/permissions.php\` + sync via artisan.\n\n`

doc += `---\n\n*Manual gerado e mantido com auxílio de \`scripts/generate-system-manual.mjs\` para referências de linha. Última atualização: ${new Date().toISOString().slice(0, 10)}.*\n`

fs.writeFileSync(OUT, doc, 'utf8')
console.log(`Manual gerado: ${OUT} (${doc.split('\n').length} linhas)`)
