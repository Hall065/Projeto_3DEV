# Manual do Sistema SENAI HUB

> Documentação funcional e técnica completa da plataforma web `Senai HUB/`.
> Última geração automática de referências: 2026-06-16.
> Para regenerar índices de linha após mudanças no código: `node scripts/generate-system-manual.mjs`.

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

- Caminhos relativos à pasta `Senai HUB/`.
- `L10–L80` = linhas 10 a 80 do arquivo indicado.
- Permissões no formato `modulo.recurso.acao`; o middleware aceita lista separada por vírgula (OR).

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

**Rotas principais:** `Senai HUB/frontend/src/routes/index.tsx` (L66–L145)

**API REST:** `Senai HUB/backend/routes/api.php` (L1–L311)

---

## 3. Arquitetura técnica

| Camada | Tecnologia | Pasta |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind, react-router, i18next | `frontend/src/` |
| Backend | Laravel, Sanctum, SQLite/MySQL | `backend/` |
| Autenticação | Bearer token (Sanctum) em `localStorage` | `frontend/src/services/api.ts`, `AuthContext` |
| Permissões | `config/permissions.php` + `custom_permissions` no usuário | `backend/app/Services/Auth/PermissionService.php` |

**Providers do App (ordem de montagem):** `Senai HUB/frontend/src/App.tsx` (L14–L38)

**Guards de rota:** `ProtectedRoute`, `ModuleAccessRoute`, `PermissionRoute`, `AdminRoute` em `frontend/src/routes/`.

---

## 4. Modelo de dados (banco)

### 4.1 Hub / compartilhado

| Tabela | Model | Descrição |
|---|---|---|
| `users` | `User` | Contas de login, papel, permissões customizadas, avatar |
| `applications` | `Application` | Apps exibidos no launcher (Connect, Grid, SAFE) |
| `application_user` | pivot | Apps liberados por usuário |
| `hub_people` | `HubPerson` | Cadastro unificado de pessoas (base de alunos/professores) |
| `hub_notifications` | `HubNotification` | Notificações in-app |
| `access_requests` | `AccessRequest` | Solicitações públicas de acesso |
| `personal_access_tokens` | Sanctum | Tokens de API |
| `report_presets` | `ReportPreset` | Presets de relatórios salvos |
| `spreadsheet_import_logs` | `SpreadsheetImportLog` | Log de importações CSV |

### 4.2 Connect

| Tabela | Model |
|---|---|
| `connect_courses` | `ConnectCourse` |
| `connect_classes` | `ConnectClass` |
| `connect_students` | `ConnectStudent` |
| `connect_teachers` | `ConnectTeacher` |
| `connect_class_weekly_patterns` | `ConnectClassWeeklyPattern` |
| `connect_lesson_schedules` | `ConnectLessonSchedule` |
| `connect_attendance_sessions` | `ConnectAttendanceSession` |
| `connect_attendance_marks` | `ConnectAttendanceMark` |
| `connect_contracts` | `ConnectContract` |
| `connect_contract_attachments` | `ConnectContractAttachment` |
| `connect_salary_records` | `ConnectSalaryRecord` |
| `connect_student_locations` | `ConnectStudentLocation` |
| `connect_activities` | `ConnectActivity` |
| `connect_alerts` | `ConnectAlert` |
| `connect_course_hub_person` | pivot curso↔pessoa |
| `connect_class_hub_person` | pivot turma↔pessoa |

### 4.3 Grid

| Tabela | Model |
|---|---|
| `grid_tickets` | `GridTicket` |
| `grid_tasks` | `GridTask` |
| `grid_inventory_items` | `GridInventoryItem` |
| `grid_inventory_reservations` | `GridInventoryReservation` |
| `grid_users` | `GridUser` |
| `grid_ticket_attachments` | `GridTicketAttachment` |

### 4.4 SAFE

| Tabela | Model |
|---|---|
| `safe_students` | `SafeStudent` (vínculo `connect_student_id`) |
| `safe_authorizations` | `SafeAuthorization` |
| `safe_authorization_logs` | `SafeAuthorizationLog` |

Migrations: `backend/database/migrations/` (29 arquivos).

---

## 5. Autenticação, papéis e permissões

**Configuração:** `Senai HUB/backend/config/permissions.php` (L1–L336)

**Serviço de permissões:** `Senai HUB/backend/app/Services/Auth/PermissionService.php` (L1–L200)

**Escopo de dados por usuário:** `Senai HUB/backend/app/Support/UserAccessScope.php` (L1–L150)

Papéis principais: `admin`, `unassigned`, `connect_*`, `grid_*`, `safe_*`. Admin possui `*`. Usuários com `custom_permissions` JSON substituem o pacote padrão do papel.

---

## 6. Área pública e autenticação

### PUB-01. Landing page

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Página institucional pública com hero, recursos, público-alvo e CTA para login.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/LandingPage.tsx` (L1–L30) |
| Seções | `frontend/src/components/landing/*` |

**Componentes relacionados:** `components/landing/LandingHeader, LandingFooter, HubPreviewMockup`.

---

### PUB-02. Login

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/login` |

**O que é / o que faz:** Autenticação email/senha; redireciona para /hub.

**Tabelas e relacionamentos:** users; personal_access_tokens.

**Endpoints API:**
- `POST /auth/login`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/LoginPage.tsx` (L1–L105) |
| Service | `Senai HUB/frontend/src/services/authService.ts` (L1–L80) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/AuthController.php` (L23–L36) |
| Service BE | `Senai HUB/backend/app/Services/Auth/AuthService.php` (L1–L120) |

**Testes:** `tests/Feature/AuthFeatureTest.php`.

---

### PUB-03. Recuperar senha

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/recuperar-senha` |

**O que é / o que faz:** Envia e-mail com link de redefinição.

**Tabelas e relacionamentos:** users; password_reset_tokens.

**Endpoints API:**
- `POST /auth/forgot-password`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/ForgotPasswordPage.tsx` (L1–L73) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/AuthController.php` (L38–L45) |

---

### PUB-04. Redefinir senha

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/redefinir-senha` |

**O que é / o que faz:** Define nova senha a partir do token do e-mail.

**Tabelas e relacionamentos:** password_reset_tokens.

**Endpoints API:**
- `POST /auth/reset-password`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/ResetPasswordPage.tsx` (L1–L104) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/AuthController.php` (L47–L54) |

---

### PUB-05. Solicitar acesso

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/solicitar-acesso` |

**O que é / o que faz:** Formulário público; cria registro pendente e notifica admins.

**Tabelas e relacionamentos:** access_requests.

**Endpoints API:**
- `POST /access-requests`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/RequestAccessPage.tsx` (L1–L106) |
| Service | `Senai HUB/frontend/src/services/accessRequestService.ts` (L1–L30) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/AccessRequestController.php` (L13–L35) |

**Testes:** `tests/Feature/AccessRequestTest.php`.

---

### PUB-06. Health check API

| Campo | Valor |
|---|---|
| **Módulo** | Público |

**O que é / o que faz:** Endpoint de saúde para monitoramento (DB, cache).

**Endpoints API:**
- `GET /health`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/HealthController.php` (L15–L18) |
| Componente UI | `Senai HUB/frontend/src/components/layout/HealthStatusBadge.tsx` (L1–L60) |

**Testes:** `tests/Feature/HealthCheckTest.php`.

---

### PUB-07. Config pública (mapa)

| Campo | Valor |
|---|---|
| **Módulo** | Público |

**O que é / o que faz:** Blocos e parâmetros do mapa do campus (sem auth).

**Endpoints API:**
- `GET /public-config`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/PublicConfigController.php` (L10–L18) |
| Hook | `Senai HUB/frontend/src/hooks/usePublicConfig.ts` (L1–L40) |

---

### PUB-08. Página 404

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `*` |

**O que é / o que faz:** Rota não encontrada.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/NotFoundPage.tsx` (L1–L26) |

---

## 7. Módulo Hub

### HUB-01. Launcher de aplicações

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/hub` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Tela inicial após login: cards das aplicações (Connect, Grid, SAFE) conforme permissões do usuário. Usuários sem apps veem painel de acesso pendente.

**Tabelas e relacionamentos:** applications; application_user; users.

**Endpoints API:**
- `GET /applications`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/ApplicationHubPage.tsx` (L11–L67) |
| Componente | `Senai HUB/frontend/src/components/hub/ApplicationCard.tsx` (L1–L80) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/ApplicationController.php` (L12–L23) |

---

### HUB-02. Gestão de usuários (admin)

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/hub/usuarios` |
| **Permissão** | admin |

**O que é / o que faz:** CRUD de usuários, atribuição de papel, permissões customizadas de navegação e sincronização de apps.

**Tabelas e relacionamentos:** users; application_user.

**Endpoints API:**
- `GET/POST/PUT/DELETE /admin/users`
- `GET /admin/roles`
- `GET /admin/nav-permissions`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/hub/HubUsersPage.tsx` (L86–L459) |
| Service | `Senai HUB/frontend/src/services/adminService.ts` (L1–L100) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/Admin/UserManagementController.php` (L18–L165) |

**Testes:** `backend/tests/Feature/AdminUserManagementTest.php`.

---

### HUB-03. Perfil do usuário

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/perfil` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Edição de nome/e-mail, troca de senha, upload/remoção de avatar, visualização de permissões e apps, logout.

**Tabelas e relacionamentos:** users.

**Endpoints API:**
- `GET /auth/me`
- `PUT /auth/me`
- `PUT /auth/password`
- `POST/DELETE /auth/avatar`
- `POST /auth/logout`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/ProfilePage.tsx` (L145–L921) |
| Context | `Senai HUB/frontend/src/contexts/AuthContext.tsx` (L1–L224) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/AuthController.php` (L56–L131) |

---

### HUB-04. Configurações

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/configuracoes` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Idioma, aparência (atalho), preferências de notificação, redução de movimento, links rápidos.

**Tabelas e relacionamentos:** users (notification_preferences).

**Endpoints API:**
- `GET/PUT /auth/notification-preferences`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/SettingsPage.tsx` (L77–L342) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/NotificationController.php` (L82–L112) |

---

### HUB-05. Temas e wallpapers

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/temas` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Personalização visual do plano de fundo (presets ou imagem customizada); tom claro/escuro derivado do wallpaper. Persistência em localStorage.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/ThemesPage.tsx` (L1–L19) |
| Context | `Senai HUB/frontend/src/contexts/AppearanceContext.tsx` (L1–L120) |
| Constantes | `Senai HUB/frontend/src/constants/wallpapers.ts` (L1–L380) |
| Componente | `Senai HUB/frontend/src/components/settings/AppearanceSettings.tsx` (L1–L200) |

**Observações:** Sem persistência no backend — apenas cliente.

---

### HUB-06. Acesso negado

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/acesso-negado` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Exibida quando o usuário não possui permissão para a rota solicitada.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/AccessDeniedPage.tsx` (L1–L32) |
| Guard | `Senai HUB/frontend/src/routes/PermissionRoute.tsx` (L1–L80) |

---

## 8. Módulo SENAI Connect

Permissão base do módulo: `connect.access`. Layout: `frontend/src/layouts/ConnectLayout.tsx`, sidebar: `components/connect/ConnectSidebar.tsx`.

### CON-01. Dashboard Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | connect.dashboard |

**O que é / o que faz:** KPIs, gráficos de frequência, sessões por professor, alunos por curso, atividades e alertas.

**Tabelas e relacionamentos:** connect_students; connect_teachers; connect_classes; connect_attendance_marks; connect_activities; connect_alerts.

**Endpoints API:**
- `GET /connect/dashboard`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/DashboardController.php` (L1–L398) |

**Componentes relacionados:** `ConnectCharts.tsx (AttendanceDonutChart`, `QuickReportsSection)`.

---

### CON-02. Pessoas (cadastro unificado)

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/pessoas` |
| **Permissão** | connect.people.manage |

**O que é / o que faz:** CRUD de hub_people — base para alunos e professores.

**Tabelas e relacionamentos:** hub_people.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/people`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/PeoplePage.tsx` (L1–L321) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/PersonController.php` (L1–L97) |

**Componentes relacionados:** `ConnectEntityViewDrawer`.

---

### CON-03. Alunos

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/alunos` |
| **Permissão** | connect.students.view|manage |

**O que é / o que faz:** Matrícula de alunos, vínculo com turma, perfil acadêmico.

**Tabelas e relacionamentos:** connect_students; hub_people; connect_classes; connect_class_hub_person.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/students`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/StudentsPage.tsx` (L1–L446) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/StudentController.php` (L1–L200) |

**Componentes relacionados:** `ConnectEnrollmentService`.

**Testes:** `backend/tests/Feature/ConnectAccessScopeTest.php`.

---

### CON-04. Professores

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/professores` |
| **Permissão** | connect.teachers.view|manage |

**O que é / o que faz:** Cadastro de professores e especialidades.

**Tabelas e relacionamentos:** connect_teachers; hub_people.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/teachers`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/TeachersPage.tsx` (L1–L382) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/TeacherController.php` (L1–L142) |

---

### CON-05. Turmas

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/turmas` |
| **Permissão** | connect.classes.view|manage |

**O que é / o que faz:** CRUD de turmas, padrões semanais, geração de calendário e provisão de frequência.

**Tabelas e relacionamentos:** connect_classes; connect_class_weekly_patterns; connect_lesson_schedules.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/classes`
- `roster endpoints`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ClassesPage.tsx` (L1–L492) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/ClassController.php` (L1–L202) |

**Componentes relacionados:** `ConnectScheduleService`, `ClassSchedulePanel`.

**Testes:** `backend/tests/Feature/ConnectScheduleTest.php`.

---

### CON-06. Cursos

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/cursos` |
| **Permissão** | connect.courses.view|manage |

**O que é / o que faz:** CRUD de cursos; ao criar/atualizar provisiona calendário padrão do semestre.

**Tabelas e relacionamentos:** connect_courses; connect_lesson_schedules.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/courses`
- `roster`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/CoursesPage.tsx` (L1–L294) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/CourseController.php` (L1–L158) |

**Componentes relacionados:** `ConnectRosterDrawer`, `ConnectSemesterDefaults`.

**Testes:** `backend/tests/Feature/ConnectCourseCalendarProvisionTest, ConnectCourseDeleteTest.php`.

---

### CON-07. Calendário de aulas

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/calendario` |
| **Permissão** | connect.calendar.view|manage |

**O que é / o que faz:** Visualização mês/semana; CRUD de aulas; integração com padrões semanais.

**Tabelas e relacionamentos:** connect_lesson_schedules; connect_attendance_sessions.

**Endpoints API:**
- `GET /connect/calendar`
- `POST/PUT/DELETE /connect/calendar/lessons`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/CalendarPage.tsx` (L1–L552) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/CalendarController.php` (L1–L267) |

**Componentes relacionados:** `CalendarWeekGrid`.

**Testes:** `backend/tests/Feature/ConnectScheduleTest.php`.

---

### CON-08. Frequência (chamada)

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/frequencia` |
| **Permissão** | connect.attendance.view|manage |

**O que é / o que faz:** Registro de presença/falta por aula; export CSV.

**Tabelas e relacionamentos:** connect_attendance_sessions; connect_attendance_marks.

**Endpoints API:**
- `GET /connect/attendance/session`
- `POST .../marks`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/AttendancePage.tsx` (L1–L479) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/AttendanceController.php` (L1–L193) |

**Componentes relacionados:** `ConnectAttendanceService`.

**Testes:** `backend/tests/Feature/ConnectAttendanceSessionTest.php`.

---

### CON-09. Gerenciar frequência

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/gerenciar-frequencia` |
| **Permissão** | connect.attendance.view|manage |

**O que é / o que faz:** Histórico paginado de sessões de chamada e resumos.

**Tabelas e relacionamentos:** connect_attendance_sessions.

**Endpoints API:**
- `GET /connect/attendance/records`
- `class-summary`
- `student-summary`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/AttendanceManagePage.tsx` (L1–L269) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/AttendanceManageController.php` (L1–L90) |

---

### CON-10. Relatório resumido Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/relatorio (aba resumo)` |
| **Permissão** | connect.reports.view |

**O que é / o que faz:** Indicadores acadêmicos pré-definidos; export XLSX/PDF via HTML.

**Tabelas e relacionamentos:** várias connect_*.

**Endpoints API:**
- `GET /connect/reports/summary`
- `summary/xlsx`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ConnectReportsPage.tsx` (L1–L209) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/ReportController.php` (L1–L110) |

**Componentes relacionados:** `printHtmlDocument`.

---

### CON-11. Relatórios customizados Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/relatorio (builder)` |
| **Permissão** | connect.reports.view|manage |

**O que é / o que faz:** Construtor de relatórios com seções, filtros, presets e export multi-formato.

**Tabelas e relacionamentos:** report_presets; várias connect_*.

**Endpoints API:**
- `/reports/connect/*`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/CustomReportBuilder.tsx` (L1–Lnull) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/CustomReportController.php` (L1–Lnull) |

**Componentes relacionados:** `ConnectReportBuilderService`.

---

### CON-12. Localização / mapa campus

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/localizacao` |
| **Permissão** | connect.location.view |

**O que é / o que faz:** Mapa 2D/3D do campus; posição simulada ou real de alunos.

**Tabelas e relacionamentos:** connect_student_locations; connect_students.

**Endpoints API:**
- `GET /connect/locations`
- `/connect/campus-people`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/LocationPage.tsx` (L1–L425) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/LocationController.php, CampusMapController.php` (L1–Lnull) |

**Componentes relacionados:** `CampusMapContainer`, `CampusMap3DViewer`.

**Testes:** `backend/tests/Feature/CampusMapTest.php`.

---

### CON-13. Contratos de alunos

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/contratos/alunos` |
| **Permissão** | connect.contracts.* |

**O que é / o que faz:** Contratos de estágio/aprendizagem; anexos por aluno; PDF padrão com lacunas.

**Tabelas e relacionamentos:** connect_contracts; connect_contract_attachments.

**Endpoints API:**
- `GET/POST/PUT/DELETE /connect/contracts`
- `attachments`
- `generate-document`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ContractsPage.tsx` (L1–L422) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/ContractController.php` (L1–L188) |

**Componentes relacionados:** `ConnectContractAttachmentsPanel`, `ConnectContractDocumentService`.

**Testes:** `backend/tests/Feature/ConnectContractAttachmentTest.php`.

---

### CON-14. Salário Jovem Aprendiz

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/salario` |
| **Permissão** | connect.salary.view |

**O que é / o que faz:** Preview, cálculo individual/lote, histórico com base em frequência e contrato.

**Tabelas e relacionamentos:** connect_salary_records; connect_attendance_marks.

**Endpoints API:**
- `GET /connect/salaries`
- `preview`
- `calculate`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/SalaryPage.tsx` (L1–L615) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/SalaryController.php` (L1–L300) |

---

### CON-15. Planilhas Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect/planilhas` |
| **Permissão** | connect.spreadsheets |

**O que é / o que faz:** Template, export, preview e import CSV de entidades Connect.

**Tabelas e relacionamentos:** spreadsheet_import_logs.

**Endpoints API:**
- `/spreadsheets/connect/*`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/SpreadsheetHubPage.tsx` (L1–Lnull) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/SpreadsheetController.php` (L1–Lnull) |

**Componentes relacionados:** `ConnectSpreadsheetHandler`.

**Testes:** `backend/tests/Feature/SpreadsheetImportExportTest.php`.

---

### CON-16. Perfis unificados (drawer)

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `várias telas` |
| **Permissão** | conforme entidade |

**O que é / o que faz:** Visualização read-only de perfil de aluno, professor, turma, curso, pessoa, contrato.

**Tabelas e relacionamentos:** hub_people; connect_students; connect_teachers; connect_classes; connect_courses; connect_contracts.

**Endpoints API:**
- `GET /connect/*/profile`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ConnectEntityViewDrawer.tsx` (L1–Lnull) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/ProfileController.php` (L1–L224) |

---

### CON-17. Roster de curso/turma

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `Cursos/Turmas` |
| **Permissão** | connect.courses.manage|classes.manage |

**O que é / o que faz:** Matrícula individual ou importação de turma inteira no curso.

**Tabelas e relacionamentos:** connect_course_hub_person; connect_class_hub_person.

**Endpoints API:**
- `roster endpoints`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/connect/ConnectRosterDrawer.tsx` (L1–Lnull) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Connect/CourseRosterController.php, ClassRosterController.php` (L1–Lnull) |

**Componentes relacionados:** `ConnectEnrollmentService`.

**Testes:** `backend/tests/Feature/ConnectCourseRosterFromClassTest.php`.

---

## 9. Módulo SENAI Grid

### GRD-01. Dashboard Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid` |
| **Permissão** | grid.dashboard |

**O que é / o que faz:** KPIs de chamados, tarefas, estoque; gráficos e lista recente.

**Tabelas e relacionamentos:** grid_tickets; grid_tasks; grid_inventory_items.

**Endpoints API:**
- `GET /grid/dashboard`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridDashboardPage.tsx` (L1–L314) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/DashboardController.php` (L1–L458) |

**Componentes relacionados:** `GridCharts`.

---

### GRD-02. Chamados (Kanban)

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/chamados` |
| **Permissão** | grid.tickets.view|manage |

**O que é / o que faz:** Lista/Kanban de chamados; criar, atribuir, transições de status, anexos, avaliação.

**Tabelas e relacionamentos:** grid_tickets; grid_ticket_attachments.

**Endpoints API:**
- `GET/POST/PUT/DELETE /grid/tickets`
- `approve-service`
- `evaluate`
- `tasks`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridTicketsPage.tsx` (L1–L777) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/TicketController.php` (L1–L312) |

**Componentes relacionados:** `GridWorkflowService`, `GridTicketAttachmentsPanel`.

---

### GRD-03. Controle de chamados

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/controle` |
| **Permissão** | grid.controle |

**O que é / o que faz:** Console operacional: detalhe do chamado, workflow, relatório, anexos.

**Tabelas e relacionamentos:** grid_tickets.

**Endpoints API:**
- `GET /grid/tickets/{id}`
- `report`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridTicketControlPage.tsx` (L1–L337) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/TicketController.php` (L1–L312) |

**Componentes relacionados:** `GridTicketControlPanel`.

---

### GRD-04. Tarefas Kanban

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/tarefas` |
| **Permissão** | grid.tasks.manage |

**O que é / o que faz:** Board de tarefas com colunas; reserva de materiais do estoque.

**Tabelas e relacionamentos:** grid_tasks; grid_inventory_reservations.

**Endpoints API:**
- `GET/POST/PUT/DELETE /grid/tasks`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridTasksPage.tsx` (L1–L395) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/TaskController.php` (L1–L229) |

**Componentes relacionados:** `GridWorkflowService`.

---

### GRD-05. Relatórios Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/relatorios` |
| **Permissão** | grid.reports.view |

**O que é / o que faz:** KPIs + construtor de relatórios customizados do módulo Grid.

**Tabelas e relacionamentos:** report_presets; grid_*.

**Endpoints API:**
- `/reports/grid/*`
- `GET /grid/tickets`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridReportsPage.tsx` (L1–L155) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/CustomReportController.php` (L1–L119) |

**Componentes relacionados:** `GridReportBuilderService`.

---

### GRD-06. Estoque

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/estoque` |
| **Permissão** | grid.inventory.view|manage |

**O que é / o que faz:** CRUD de itens, ajuste de quantidade, upload/sync de imagem, alerta de estoque baixo.

**Tabelas e relacionamentos:** grid_inventory_items.

**Endpoints API:**
- `GET/POST/PUT/DELETE /grid/inventory`
- `adjust`
- `image`
- `sync-image`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridInventoryPage.tsx` (L1–L647) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/InventoryController.php` (L1–L215) |

**Componentes relacionados:** `InventoryImageResolver`, `InventoryDuplicateService`.

**Testes:** `backend/tests/Feature/InventoryDuplicateServiceTest (unit).php`.

---

### GRD-07. Mapa de tarefas

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/mapa` |
| **Permissão** | grid.tasks.map |

**O que é / o que faz:** Mapa do campus com chamados/tarefas abertos sobrepostos.

**Tabelas e relacionamentos:** grid_tasks; grid_tickets.

**Endpoints API:**
- `GET /grid/tasks`
- `GET /public-config`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridTaskMapPage.tsx` (L1–L143) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/TaskController.php` (L1–L229) |

**Componentes relacionados:** `CampusMapContainer`.

---

### GRD-08. Usuários Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/usuarios` |
| **Permissão** | grid.users.manage |

**O que é / o que faz:** Técnicos e equipe de manutenção (grid_users).

**Tabelas e relacionamentos:** grid_users; hub_people.

**Endpoints API:**
- `GET/POST/PUT/DELETE /grid/users`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/GridUsersPage.tsx` (L1–L309) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Grid/UserController.php` (L1–L89) |

**Testes:** `backend/tests/Feature/GridAccessScopeTest.php`.

---

### GRD-09. Planilhas Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/planilhas` |
| **Permissão** | grid.spreadsheets |

**O que é / o que faz:** Import/export CSV de tickets e estoque.

**Tabelas e relacionamentos:** spreadsheet_import_logs.

**Endpoints API:**
- `/spreadsheets/grid/*`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/grid/SpreadsheetHubPage.tsx` (L1–Lnull) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/SpreadsheetController.php` (L1–L69) |

**Componentes relacionados:** `GridSpreadsheetHandler`.

**Testes:** `backend/tests/Feature/SpreadsheetImportExportTest.php`.

---

## 10. Módulo SENAI SAFE

### SAF-01. Dashboard SAFE

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe` |
| **Permissão** | safe.dashboard |

**O que é / o que faz:** Painel conforme papel: AQV, professor ou portaria; filas e KPIs.

**Tabelas e relacionamentos:** safe_authorizations.

**Endpoints API:**
- `GET /safe/dashboard`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafeDashboardPage.tsx` (L1–L223) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/DashboardController.php` (L1–L115) |

**Testes:** `backend/tests/Feature/SafeModuleTest.php`.

---

### SAF-02. Alunos SAFE

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe/alunos` |
| **Permissão** | safe.students.manage |

**O que é / o que faz:** Listagem somente leitura espelhada do Connect; CRUD bloqueado no SAFE.

**Tabelas e relacionamentos:** safe_students; connect_students.

**Endpoints API:**
- `GET /safe/students`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafeStudentsPage.tsx` (L1–L125) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/StudentController.php` (L1–L61) |

**Componentes relacionados:** `SafeConnectStudentBridge`.

**Testes:** `backend/tests/Feature/SafeConnectStudentsTest.php`.

---

### SAF-03. Autorizações (AQV)

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe/autorizacoes` |
| **Permissão** | safe.authorizations.manage |

**O que é / o que faz:** Criar e editar solicitações de entrada/saída; histórico de auditoria.

**Tabelas e relacionamentos:** safe_authorizations; safe_authorization_logs.

**Endpoints API:**
- `GET/POST/PUT /safe/authorizations`
- `history`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafeAuthorizationsPage.tsx` (L1–L269) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/AuthorizationController.php` (L1–L140) |

**Componentes relacionados:** `SafeWorkflowService`.

**Fluxo:** AQV cria → professor aprova/nega → (se saída) portaria confirma → finalizado/arquivado.

**Testes:** `backend/tests/Feature/SafeWorkflowTest.php`.

---

### SAF-04. Detalhe da autorização

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe/autorizacoes/:id` |
| **Permissão** | safe.authorizations.manage |

**O que é / o que faz:** Timeline de eventos e dados completos do protocolo.

**Tabelas e relacionamentos:** safe_authorization_logs.

**Endpoints API:**
- `GET /safe/authorizations/{id}/history`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafeAuthorizationDetailPage.tsx` (L1–L132) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/AuthorizationController.php` (L1–L140) |

---

### SAF-05. Aprovações (professor)

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe/aprovacoes` |
| **Permissão** | safe.approve |

**O que é / o que faz:** Fila de autorizações pendentes para aprovar ou negar.

**Tabelas e relacionamentos:** safe_authorizations.

**Endpoints API:**
- `GET /safe/teacher/authorizations`
- `approve`
- `deny`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafeApprovalsPage.tsx` (L1–L131) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/TeacherController.php` (L1–L54) |

**Componentes relacionados:** `SafeWorkflowService`.

**Testes:** `backend/tests/Feature/SafeWorkflowTest.php`.

---

### SAF-06. Portaria

| Campo | Valor |
|---|---|
| **Módulo** | SAFE |
| **Rota UI** | `/safe/portaria` |
| **Permissão** | safe.portaria |

**O que é / o que faz:** Confirmação física de saída/entrada na portaria.

**Tabelas e relacionamentos:** safe_authorizations.

**Endpoints API:**
- `GET /safe/portaria/authorizations`
- `confirm`
- `deny`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Frontend | `Senai HUB/frontend/src/pages/safe/SafePortariaPage.tsx` (L1–L128) |
| Backend | `Senai HUB/backend/app/Http/Controllers/Api/Safe/PortariaController.php` (L1–L50) |

**Componentes relacionados:** `SafeWorkflowService`.

**Testes:** `backend/tests/Feature/SafeWorkflowTest.php`.

---

## 11. Recursos globais (transversais)

### GLB-01. Busca global (Ctrl+K)

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `Qualquer tela autenticada` |
| **Permissão** | Autenticado (resultados filtrados por permissão) |

**O que é / o que faz:** Paleta de busca unificada: alunos, turmas, chamados, estoque. Debounce 250ms, mínimo 2 caracteres.

**Tabelas e relacionamentos:** connect_students; connect_classes; grid_tickets; grid_inventory_items.

**Endpoints API:**
- `GET /search?q=`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Context | `Senai HUB/frontend/src/contexts/GlobalSearchContext.tsx` (L1–L80) |
| UI | `Senai HUB/frontend/src/components/search/GlobalSearchPalette.tsx` (L1–L200) |
| Service BE | `Senai HUB/backend/app/Services/Search/GlobalSearchService.php` (L1–L150) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/GlobalSearchController.php` (L16–L25) |

---

### GLB-02. Notificações in-app

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `Sino no header` |
| **Permissão** | Autenticado |

**O que é / o que faz:** Bell com contagem não lida (poll 45s); marcar lida; e-mail conforme preferências.

**Tabelas e relacionamentos:** hub_notifications; users.notification_preferences.

**Endpoints API:**
- `GET /notifications`
- `unread-count`
- `PATCH read`
- `read-all`
- `DELETE`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Context | `Senai HUB/frontend/src/contexts/NotificationContext.tsx` (L1–L120) |
| UI | `Senai HUB/frontend/src/components/notifications/NotificationBell.tsx` (L1–L150) |
| Service BE | `Senai HUB/backend/app/Services/Notification/NotificationService.php` (L1–L200) |
| Triggers | `Senai HUB/backend/app/Services/Notification/SystemNotificationTriggers.php` (L1–L300) |

**Testes:** `backend/tests/Feature/NotificationTest.php`.

---

### GLB-03. Chat de suporte

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `Botão Suporte nas sidebars` |
| **Permissão** | Autenticado / público (landing) |

**O que é / o que faz:** Widget flutuante estilo messenger; mensagens locais com resposta automática placeholder (IA futura).

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Context | `Senai HUB/frontend/src/contexts/SupportChatContext.tsx` (L1–L120) |
| Widget | `Senai HUB/frontend/src/components/support/SupportChatWidget.tsx` (L1–L180) |
| Trigger | `Senai HUB/frontend/src/components/support/SupportChatTrigger.tsx` (L1–L30) |

**Observações:** Sem backend ainda — integração futura via SupportChatContext.sendMessage.

---

### GLB-04. Internacionalização (i18n)

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `Todas as telas` |
| **Permissão** | — |

**O que é / o que faz:** Português (padrão), inglês e espanhol; locales base + supplement JSON.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Config | `Senai HUB/frontend/src/i18n/index.ts` (L1–L80) |
| Locales | `frontend/src/i18n/locales/*.json` e `supplement/*.json` |
| UI | `Senai HUB/frontend/src/components/settings/LanguageSwitcher.tsx` (L1–L60) |

---

### GLB-05. Identidade visual / logos

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `—` |
| **Permissão** | — |

**O que é / o que faz:** Pacote de logos por app: expanded, icon, mark-light, mark-dark. Script de sincronização SAFE/HUB.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Assets | `Senai HUB/frontend/src/assets/brand/index.ts` (L1–L40) |
| Util | `Senai HUB/frontend/src/utils/appBrandAssets.ts` (L1–L130) |
| Script | `Senai HUB/frontend/scripts/sync-brand-assets.mjs` (L1–L50) |
| Regra | `Senai HUB/.cursor/rules/senai-hub-brand.mdc` (L1–L50) |

---

### GLB-06. Toast e confirmações

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `—` |
| **Permissão** | — |

**O que é / o que faz:** Feedback de sucesso/erro e diálogos de confirmação para ações destrutivas.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Toast | `Senai HUB/frontend/src/contexts/ToastContext.tsx` (L1–L97) |
| Confirm | `Senai HUB/frontend/src/contexts/ConfirmContext.tsx` (L1–L80) |
| Hook | `Senai HUB/frontend/src/hooks/useCrudToast.ts` (L1–L40) |

---

## 12. Relatórios personalizados

Módulos: **connect** e **grid**. Builder compartilhado: `Senai HUB/frontend/src/components/reports/CustomReportBuilder.tsx` (L45–L610).

- Schema e seções: `backend/app/Support/Reports/ReportSchemaRegistry.php`
- Builders: `ConnectReportBuilderService.php`, `GridReportBuilderService.php`
- Export: CSV, XLSX, JSON, HTML (PDF via impressão do navegador — `openHtmlInNewTab` em `frontend/src/utils/downloadFile.ts`)
- Template impressão: `backend/resources/views/reports/print.blade.php`

## 13. Importação e exportação por planilhas

| Módulo | Chaves (`spreadsheet_key`) | Handler |
|---|---|---|
| Connect | students, teachers, classes, courses, attendance, contracts, ... | `ConnectSpreadsheetHandler.php` |
| Grid | tickets, inventory | `GridSpreadsheetHandler.php` |

Orquestração: `Senai HUB/backend/app/Services/Spreadsheet/SpreadsheetService.php` (L1–L200). UI: `Senai HUB/frontend/src/pages/spreadsheet/SpreadsheetHubPage.tsx` (L24–L346).

## 14. Arquivo histórico

### ARC-01. Arquivo histórico Hub

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/hub/arquivo` |
| **Permissão** | connect.classes.view | grid.tickets.view | safe.access (conforme aba) |

**O que é / o que faz:** Consulta turmas encerradas, chamados concluídos e autorizações SAFE finalizadas; arquivamento automático de turmas com data fim vencida.

**Tabelas e relacionamentos:** connect_classes; grid_tickets; safe_authorizations.

**Endpoints API:**
- `GET /archive/summary`
- `connect/classes`
- `grid/tickets`
- `safe/authorizations`
- `POST /archive/run-auto-archive`

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Página | `Senai HUB/frontend/src/pages/hub/HubArchivePage.tsx` (L30–L394) |
| Service | `Senai HUB/frontend/src/services/archiveService.ts` (L1–L80) |
| Controller | `Senai HUB/backend/app/Http/Controllers/Api/ArchiveController.php` (L27–L155) |
| Service BE | `Senai HUB/backend/app/Services/Connect/ConnectClassArchiveService.php` (L1–L100) |

**Testes:** `backend/tests/Feature/ArchiveTest.php`.

---

## 15. Testes automatizados

| Arquivo | Escopo |
|---|---|
| `backend/tests/Feature/AccessRequestTest.php` | Feature |
| `backend/tests/Feature/AdminUserManagementTest.php` | Feature |
| `backend/tests/Feature/ArchiveTest.php` | Feature |
| `backend/tests/Feature/AuthFeatureTest.php` | Feature |
| `backend/tests/Feature/CampusMapTest.php` | Feature |
| `backend/tests/Feature/ConnectAccessScopeTest.php` | Feature |
| `backend/tests/Feature/ConnectAttendanceSessionTest.php` | Feature |
| `backend/tests/Feature/ConnectContractAttachmentTest.php` | Feature |
| `backend/tests/Feature/ConnectCourseCalendarProvisionTest.php` | Feature |
| `backend/tests/Feature/ConnectCourseDeleteTest.php` | Feature |
| `backend/tests/Feature/ConnectCourseRosterFromClassTest.php` | Feature |
| `backend/tests/Feature/ConnectScheduleTest.php` | Feature |
| `backend/tests/Feature/ExampleTest.php` | Feature |
| `backend/tests/Feature/GridAccessScopeTest.php` | Feature |
| `backend/tests/Feature/GridTicketAttachmentTest.php` | Feature |
| `backend/tests/Feature/HealthCheckTest.php` | Feature |
| `backend/tests/Feature/NotificationTest.php` | Feature |
| `backend/tests/Feature/SafeConnectStudentsTest.php` | Feature |
| `backend/tests/Feature/SafeModuleTest.php` | Feature |
| `backend/tests/Feature/SafeWorkflowTest.php` | Feature |
| `backend/tests/Feature/SpreadsheetImportExportTest.php` | Feature |
| `backend/tests/Unit/ExampleTest.php` | Unit |
| `backend/tests/Unit/InventoryDuplicateServiceTest.php` | Unit |
| `backend/tests/Unit/InventoryImageResolverTest.php` | Unit |

## Anexo A — Mapa completo de rotas API

Fonte: `Senai HUB/backend/routes/api.php` (L54–L311)

```
Route::get('/health', [HealthController::class, 'index']);
Route::get('/public-config', [PublicConfigController::class, 'index']);
Route::post('/access-requests', [AccessRequestController::class, 'store'])->middleware('throttle:5,1');
Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/permissions-catalog', [AuthController::class, 'permissionsCatalog']);
        Route::put('/me', [AuthController::class, 'update']);
        Route::post('/avatar', [AuthController::class, 'updateAvatar']);
        Route::delete('/avatar', [AuthController::class, 'deleteAvatar']);
        Route::put('/password', [AuthController::class, 'changePassword']);
        Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
        Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);
        Route::post('/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/search', GlobalSearchController::class);
    Route::prefix('notifications')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::prefix('archive')->group(function (): void {
        Route::get('/summary', [ArchiveController::class, 'summary']);
        Route::get('/connect/classes', [ArchiveController::class, 'connectClasses']);
        Route::get('/grid/tickets', [ArchiveController::class, 'gridTickets']);
        Route::get('/safe/authorizations', [ArchiveController::class, 'safeAuthorizations']);
        Route::post('/run-auto-archive', [ArchiveController::class, 'runAutoArchive'])->middleware('admin');
    Route::prefix('admin')->middleware('admin')->group(function (): void {
        Route::get('/roles', [UserManagementController::class, 'roles']);
        Route::get('/nav-permissions', [UserManagementController::class, 'navPermissions']);
        Route::get('/users', [UserManagementController::class, 'index']);
        Route::get('/users/{user}', [UserManagementController::class, 'show']);
        Route::post('/users', [UserManagementController::class, 'store']);
        Route::put('/users/{user}', [UserManagementController::class, 'update']);
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy']);
    Route::prefix('reports/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/schema', [CustomReportController::class, 'schema'])
        Route::get('/filter-options', [CustomReportController::class, 'filterOptions'])
        Route::get('/presets', [ReportPresetController::class, 'index'])
        Route::post('/presets', [ReportPresetController::class, 'store'])
        Route::put('/presets/{preset}', [ReportPresetController::class, 'update'])
        Route::delete('/presets/{preset}', [ReportPresetController::class, 'destroy'])
        Route::post('/build', [CustomReportController::class, 'build'])
        Route::post('/export-csv', [CustomReportController::class, 'exportCsv'])
        Route::post('/export-xlsx', [CustomReportController::class, 'exportXlsx'])
        Route::post('/export-json', [CustomReportController::class, 'exportJson'])
        Route::post('/export-html', [CustomReportController::class, 'exportHtml'])
    Route::prefix('spreadsheets/{module}')->whereIn('module', ['connect', 'grid'])->group(function (): void {
        Route::get('/', [SpreadsheetController::class, 'index'])
        Route::get('/import-logs', [SpreadsheetController::class, 'logs'])
        Route::get('/{key}/template', [SpreadsheetController::class, 'template'])
        Route::get('/{key}/export', [SpreadsheetController::class, 'export'])
        Route::post('/{key}/preview', [SpreadsheetController::class, 'preview'])
        Route::post('/{key}/import', [SpreadsheetController::class, 'import'])
    Route::prefix('connect')->middleware('permission:connect.access')->group(function (): void {
        Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:connect.dashboard');
        Route::middleware('permission:connect.people.manage')->group(function (): void {
            Route::get('/people/{person}/profile', [ProfileController::class, 'person']);
            Route::get('/people', [PersonController::class, 'index']);
            Route::post('/people', [PersonController::class, 'store']);
            Route::put('/people/{person}', [PersonController::class, 'update']);
            Route::delete('/people/{person}', [PersonController::class, 'destroy']);
        Route::get('/students/{student}/profile', [ProfileController::class, 'student'])->middleware('permission:connect.students.view,connect.students.manage');
        Route::get('/students', [StudentController::class, 'index'])->middleware('permission:connect.students.view,connect.students.manage');
        Route::middleware('permission:connect.students.manage')->group(function (): void {
            Route::post('/students', [StudentController::class, 'store']);
            Route::put('/students/{student}', [StudentController::class, 'update']);
            Route::delete('/students/{student}', [StudentController::class, 'destroy']);
        Route::get('/teachers/{teacher}/profile', [ProfileController::class, 'teacher'])->middleware('permission:connect.teachers.view,connect.teachers.manage');
        Route::get('/teachers', [TeacherController::class, 'index'])->middleware('permission:connect.teachers.view,connect.teachers.manage');
        Route::middleware('permission:connect.teachers.manage')->group(function (): void {
            Route::post('/teachers', [TeacherController::class, 'store']);
            Route::put('/teachers/{teacher}', [TeacherController::class, 'update']);
            Route::delete('/teachers/{teacher}', [TeacherController::class, 'destroy']);
        Route::get('/classes/{connectClass}/profile', [ProfileController::class, 'classProfile'])->middleware('permission:connect.classes.view,connect.classes.manage');
        Route::get('/classes', [ClassController::class, 'index'])->middleware('permission:connect.classes.view,connect.classes.manage');
        Route::middleware('permission:connect.classes.manage')->group(function (): void {
            Route::post('/classes', [ClassController::class, 'store']);
            Route::put('/classes/{connectClass}', [ClassController::class, 'update']);
            Route::delete('/classes/{connectClass}', [ClassController::class, 'destroy']);
            Route::get('/classes/{connectClass}/roster', [ClassRosterController::class, 'index']);
            Route::post('/classes/{connectClass}/roster', [ClassRosterController::class, 'store']);
            Route::delete('/classes/{connectClass}/roster/{person}', [ClassRosterController::class, 'destroy']);
        Route::get('/courses/{course}/profile', [ProfileController::class, 'course'])->middleware('permission:connect.courses.view,connect.courses.manage');
        Route::get('/courses', [CourseController::class, 'index'])->middleware('permission:connect.courses.view,connect.courses.manage');
        Route::middleware('permission:connect.courses.manage')->group(function (): void {
            Route::post('/courses', [CourseController::class, 'store']);
            Route::put('/courses/{course}', [CourseController::class, 'update']);
            Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
            Route::get('/courses/{course}/roster', [CourseRosterController::class, 'index']);
            Route::post('/courses/{course}/roster/from-class', [CourseRosterController::class, 'storeFromClass']);
            Route::post('/courses/{course}/roster', [CourseRosterController::class, 'store']);
            Route::delete('/courses/{course}/roster/{person}', [CourseRosterController::class, 'destroy']);
        Route::get('/calendar', [CalendarController::class, 'index'])->middleware('permission:connect.calendar.view,connect.calendar.manage');
        Route::get('/calendar/semesters', [CalendarController::class, 'semesters'])->middleware('permission:connect.calendar.view,connect.calendar.manage');
        Route::get('/classes/{connectClass}/weekly-patterns', [CalendarController::class, 'weeklyPatterns'])->middleware('permission:connect.calendar.view,connect.calendar.manage,connect.classes.view,connect.classes.manage');
        Route::get('/classes/{connectClass}/schedule-plan', [CalendarController::class, 'schedulePlan'])->middleware('permission:connect.calendar.view,connect.calendar.manage,connect.classes.view,connect.classes.manage');
        Route::middleware('permission:connect.calendar.manage,connect.classes.manage')->group(function (): void {
            Route::post('/calendar/lessons', [CalendarController::class, 'storeLesson']);
            Route::put('/calendar/lessons/{connectLessonSchedule}', [CalendarController::class, 'updateLesson']);
            Route::delete('/calendar/lessons/{connectLessonSchedule}', [CalendarController::class, 'destroyLesson']);
            Route::put('/classes/{connectClass}/weekly-patterns', [CalendarController::class, 'syncWeeklyPatterns']);
            Route::post('/classes/{connectClass}/generate-schedule', [CalendarController::class, 'generateSchedule']);
            Route::post('/classes/{connectClass}/provision-attendance', [CalendarController::class, 'provisionAttendance']);
        Route::get('/attendance/session', [AttendanceController::class, 'show'])->middleware('permission:connect.attendance.view,connect.attendance.view_own,connect.attendance.manage');
        Route::post('/attendance/sessions/{session}/marks', [AttendanceController::class, 'saveMarks'])->middleware('permission:connect.attendance.manage');
        Route::get('/attendance/records', [AttendanceManageController::class, 'index'])->middleware('permission:connect.attendance.view,connect.attendance.manage');
        Route::get('/attendance/class-summary', [AttendanceManageController::class, 'classSummary'])->middleware('permission:connect.attendance.view,connect.attendance.manage');
        Route::get('/attendance/student-summary', [AttendanceManageController::class, 'studentSummary'])->middleware('permission:connect.attendance.view,connect.attendance.manage');
        Route::get('/reports/summary', [ReportController::class, 'summary'])->middleware('permission:connect.reports.view,connect.reports.manage');
        Route::get('/reports/summary/xlsx', [ReportController::class, 'summaryXlsx'])->middleware('permission:connect.reports.view,connect.reports.manage');
        Route::get('/locations', [LocationController::class, 'index'])->middleware('permission:connect.location.view');
        Route::get('/campus-people', [CampusMapController::class, 'people'])->middleware('permission:connect.location.view');
        Route::get('/contracts/{contract}/profile', [ProfileController::class, 'contract'])->middleware('permission:connect.contracts.view,connect.contracts.view_own,connect.contracts.manage');
        Route::get('/contracts', [ContractController::class, 'index'])->middleware('permission:connect.contracts.view,connect.contracts.view_own,connect.contracts.manage');
        Route::middleware('permission:connect.contracts.manage')->group(function (): void {
            Route::post('/contracts', [ContractController::class, 'store']);
            Route::put('/contracts/{contract}', [ContractController::class, 'update']);
            Route::delete('/contracts/{contract}', [ContractController::class, 'destroy']);
            Route::post('/contracts/{contract}/attachments', [ContractController::class, 'storeAttachment']);
            Route::delete('/contracts/{contract}/attachments/{connectContractAttachment}', [ContractController::class, 'destroyAttachment']);
            Route::post('/contracts/{contract}/generate-document', [ContractController::class, 'generateDocument']);
        Route::get('/salaries', [SalaryController::class, 'index'])->middleware('permission:connect.salary.view,connect.salary.view_own');
        Route::get('/salaries/preview', [SalaryController::class, 'preview'])->middleware('permission:connect.salary.view,connect.salary.view_own');
        Route::post('/salaries/calculate', [SalaryController::class, 'calculate'])->middleware('admin');
        Route::post('/salaries/calculate-batch', [SalaryController::class, 'calculateBatch'])->middleware('admin');
    Route::prefix('grid')->middleware('permission:grid.access')->group(function (): void {
        Route::get('/dashboard', [GridDashboardController::class, 'index'])->middleware('permission:grid.dashboard');
        Route::get('/tickets', [GridTicketController::class, 'index'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::get('/tickets/{ticket}', [GridTicketController::class, 'show'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::get('/tickets/{ticket}/report', [GridTicketController::class, 'report'])->middleware('permission:grid.reports.view');
        Route::post('/tickets', [GridTicketController::class, 'store'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/tasks', [GridTicketController::class, 'createTask'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/approve-service', [GridTicketController::class, 'approveService'])->middleware('permission:grid.tickets.manage');
        Route::post('/tickets/{ticket}/evaluate', [GridTicketController::class, 'evaluate'])->middleware('permission:grid.tickets.manage');
        Route::put('/tickets/{ticket}', [GridTicketController::class, 'update'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::post('/tickets/{ticket}/attachments', [GridTicketController::class, 'storeAttachment'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::delete('/tickets/{ticket}/attachments/{gridTicketAttachment}', [GridTicketController::class, 'destroyAttachment'])->middleware('permission:grid.tickets.view,grid.tickets.manage');
        Route::delete('/tickets/{ticket}', [GridTicketController::class, 'destroy'])->middleware('permission:grid.tickets.manage');
        Route::get('/tasks', [GridTaskController::class, 'index'])->middleware('permission:grid.tasks.manage');
        Route::post('/tasks', [GridTaskController::class, 'store'])->middleware('permission:grid.tasks.manage');
        Route::put('/tasks/{task}', [GridTaskController::class, 'update'])->middleware('permission:grid.tasks.manage');
        Route::delete('/tasks/{task}', [GridTaskController::class, 'destroy'])->middleware('permission:grid.tasks.manage');
        Route::get('/inventory', [GridInventoryController::class, 'index'])->middleware('permission:grid.inventory.view,grid.inventory.manage');
        Route::get('/inventory/{inventoryItem}', [GridInventoryController::class, 'show'])->middleware('permission:grid.inventory.view,grid.inventory.manage');
        Route::middleware('permission:grid.inventory.manage')->group(function (): void {
            Route::post('/inventory', [GridInventoryController::class, 'store']);
            Route::put('/inventory/{inventoryItem}', [GridInventoryController::class, 'update']);
            Route::post('/inventory/{inventoryItem}/adjust', [GridInventoryController::class, 'adjust']);
            Route::post('/inventory/{inventoryItem}/sync-image', [GridInventoryController::class, 'syncImage']);
            Route::post('/inventory/{inventoryItem}/image', [GridInventoryController::class, 'uploadImage']);
            Route::delete('/inventory/{inventoryItem}', [GridInventoryController::class, 'destroy']);
        Route::middleware('permission:grid.users.manage')->group(function (): void {
            Route::get('/users', [GridUserController::class, 'index']);
            Route::get('/users/{gridUser}', [GridUserController::class, 'show']);
            Route::post('/users', [GridUserController::class, 'store']);
            Route::put('/users/{gridUser}', [GridUserController::class, 'update']);
            Route::delete('/users/{gridUser}', [GridUserController::class, 'destroy']);
    Route::prefix('safe')->middleware('permission:safe.access')->group(function (): void {
        Route::get('/dashboard', [SafeDashboardController::class, 'index'])->middleware('permission:safe.dashboard');
        Route::middleware('permission:safe.students.manage')->group(function (): void {
            Route::get('/students', [SafeStudentController::class, 'index']);
            Route::post('/students', [SafeStudentController::class, 'store']);
            Route::get('/students/{safeStudent}', [SafeStudentController::class, 'show']);
            Route::put('/students/{safeStudent}', [SafeStudentController::class, 'update']);
            Route::delete('/students/{safeStudent}', [SafeStudentController::class, 'destroy']);
        Route::middleware('permission:safe.authorizations.manage')->group(function (): void {
            Route::get('/authorizations', [SafeAuthorizationController::class, 'index']);
            Route::post('/authorizations', [SafeAuthorizationController::class, 'store']);
            Route::get('/authorizations/{safeAuthorization}', [SafeAuthorizationController::class, 'show']);
            Route::put('/authorizations/{safeAuthorization}', [SafeAuthorizationController::class, 'update']);
            Route::get('/authorizations/{safeAuthorization}/history', [SafeAuthorizationController::class, 'history']);
        Route::prefix('teacher')->middleware('permission:safe.approve')->group(function (): void {
            Route::get('/authorizations', [SafeTeacherController::class, 'index']);
            Route::post('/authorizations/{safeAuthorization}/approve', [SafeTeacherController::class, 'approve']);
            Route::post('/authorizations/{safeAuthorization}/deny', [SafeTeacherController::class, 'deny']);
        Route::prefix('portaria')->middleware('permission:safe.portaria')->group(function (): void {
            Route::get('/authorizations', [SafePortariaController::class, 'index']);
            Route::post('/authorizations/{safeAuthorization}/confirm', [SafePortariaController::class, 'confirm']);
            Route::post('/authorizations/{safeAuthorization}/deny', [SafePortariaController::class, 'deny']);
```

## Anexo B — Mapa de rotas do frontend

Fonte: `Senai HUB/frontend/src/routes/index.tsx` (L66–L145)

| Rota | Página |
|---|---|
| `/login` | `LoginPage` |
| `/recuperar-senha` | `ForgotPasswordPage` |
| `/redefinir-senha` | `ResetPasswordPage` |
| `/solicitar-acesso` | `RequestAccessPage` |
| `/hub` | `ApplicationHubPage` |
| `/hub/arquivo` | `HubArchivePage` |
| `/hub/usuarios` | `HubUsersPage` |
| `/configuracoes` | `SettingsPage` |
| `/temas` | `ThemesPage` |
| `/perfil` | `ProfilePage` |
| `/acesso-negado` | `AccessDeniedPage` |
| `/grid` | `GridDashboardPage` |
| `/grid/chamados` | `GridTicketsPage` |
| `/grid/controle` | `GridTicketControlPage` |
| `/grid/tarefas` | `GridTasksPage` |
| `/grid/relatorios` | `GridReportsPage` |
| `/grid/estoque` | `GridInventoryPage` |
| `/grid/mapa` | `LazyPage` |
| `/grid/usuarios` | `GridUsersPage` |
| `/grid/planilhas` | `LazyPage` |
| `/connect` | `ConnectOverviewPage` |
| `/connect/pessoas` | `PeoplePage` |
| `/connect/alunos` | `StudentsPage` |
| `/connect/professores` | `TeachersPage` |
| `/connect/turmas` | `ClassesPage` |
| `/connect/cursos` | `CoursesPage` |
| `/connect/calendario` | `CalendarPage` |
| `/connect/frequencia` | `AttendancePage` |
| `/connect/gerenciar-frequencia` | `AttendanceManagePage` |
| `/connect/relatorio` | `ConnectReportsPage` |
| `/connect/localizacao` | `LazyPage` |
| `/connect/contratos/alunos` | `ContractsPage` |
| `/connect/salario` | `SalaryPage` |
| `/connect/planilhas` | `LazyPage` |
| `/safe` | `SafeDashboardPage` |
| `/safe/alunos` | `SafeStudentsPage` |
| `/safe/autorizacoes` | `SafeAuthorizationsPage` |
| `/safe/autorizacoes/:id` | `SafeAuthorizationDetailPage` |
| `/safe/aprovacoes` | `SafeApprovalsPage` |
| `/safe/portaria` | `SafePortariaPage` |
| `/` | `LandingPage` |
| `/dashboard` | `Navigate` |
| `*` | `NotFoundPage` |

## Anexo C — Serviços backend

### `Senai HUB/backend/app/Services/Auth/AuthService.php` (235 linhas)
Métodos públicos: login, register, updateProfile, updateAvatar, removeAvatar, changePassword, logout, sendPasswordResetLink, resetPassword

### `Senai HUB/backend/app/Services/Auth/PermissionService.php` (155 linhas)
Métodos públicos: permissionsFor, defaultPermissionsForRole, buildCustomPermissions, can, applicationSlugsFor, canAccessConnect, canAccessGrid, canAccessSafe

### `Senai HUB/backend/app/Services/Connect/ConnectAttendanceService.php` (256 linhas)
Métodos públicos: provisionSessionsForClass, provisionSessionForLesson, findOrCreateSession, classSummary, studentSummary

### `Senai HUB/backend/app/Services/Connect/ConnectCampusMapService.php` (222 linhas)
Métodos públicos: peopleForUser

### `Senai HUB/backend/app/Services/Connect/ConnectClassArchiveService.php` (53 linhas)
Métodos públicos: archiveExpiredClasses, countPendingAutoArchive

### `Senai HUB/backend/app/Services/Connect/ConnectContractAttachmentService.php` (104 linhas)
Métodos públicos: store, storeFromContents, delete, deleteAllForContract, publicUrl, canDelete

### `Senai HUB/backend/app/Services/Connect/ConnectContractDocumentService.php` (141 linhas)
Métodos públicos: __construct, templateData, renderHtml, renderPdf, generateAndAttach

### `Senai HUB/backend/app/Services/Connect/ConnectEnrollmentService.php` (179 linhas)
Métodos públicos: attachPersonToCourse, detachPersonFromCourse, attachStudentToClass, detachStudentFromClass, syncPivotsForStudent, syncTeacherCourseFromClass, enrollClassInCourse

### `Senai HUB/backend/app/Services/Connect/ConnectScheduleService.php` (530 linhas)
Métodos públicos: __construct, syncWeeklyPatterns, ensureClassCalendar, provisionDefaultSemesterCalendar, schedulePlan, generateFromPatterns, createLesson, updateLesson, assertNoDuplicateSemesterEnrollment, validateClassAssignment, assertNoConflict

### `Senai HUB/backend/app/Services/Grid/GridTicketAttachmentService.php` (79 linhas)
Métodos públicos: store, delete, deleteAllForTicket, publicUrl, canDelete

### `Senai HUB/backend/app/Services/Grid/GridWorkflowService.php` (619 linhas)
Métodos públicos: assertInventoryLinesAvailable, resolveStatusForNewTicket, updateTicket, transitionTicketStatus, enterEmAtendimento, ensurePrimaryTask, approveService, evaluateTicket, createTaskFromTicket, handleTaskColumnChange, syncTicketOnTaskChange, syncInventoryForTask, …

### `Senai HUB/backend/app/Services/Grid/InventoryDuplicateService.php` (250 linhas)
Métodos públicos: normalizeTitle, normalizeSku, findExisting, mergeIncomingQuantity, mergeAllDuplicates, findDuplicateGroups

### `Senai HUB/backend/app/Services/Grid/InventoryImageResolver.php` (299 linhas)
Métodos públicos: resolve, apply, storeUpload, isStoredUpload, deleteStoredUpload, applyQuick, isLegacyBrokenUrl, normalizeThumbnailUrl, publicImageUrl, resolveQuick

### `Senai HUB/backend/app/Services/HealthService.php` (60 linhas)
Métodos públicos: check

### `Senai HUB/backend/app/Services/Notification/HubMailDispatcher.php` (161 linhas)
Métodos públicos: sendForUser, sendToAddress

### `Senai HUB/backend/app/Services/Notification/NotificationService.php` (151 linhas)
Métodos públicos: __construct, notify, notifyMany, notifyRole, notifyPermission, userIdsByName, unreadCount, markRead, markAllRead, admins

### `Senai HUB/backend/app/Services/Notification/SafeNotificationTriggers.php` (132 linhas)
Métodos públicos: __construct, authorizationCreated, teacherApproved, teacherDenied, portariaConfirmed, portariaDenied

### `Senai HUB/backend/app/Services/Notification/SystemNotificationTriggers.php` (603 linhas)
Métodos públicos: __construct, userCreated, userRoleUpdated, passwordChanged, accessRequestSubmitted, connectStudentEnrolled, connectClassAssigned, connectCourseRosterAdded, connectLessonScheduled, connectLessonCancelled, connectScheduleGenerated, connectAttendanceSaved, …

### `Senai HUB/backend/app/Services/Reports/ConnectReportBuilderService.php` (548 linhas)
Métodos públicos: build

### `Senai HUB/backend/app/Services/Reports/CustomReportService.php` (146 linhas)
Métodos públicos: __construct, schema, build, exportCsv, exportXlsx, exportJson, exportHtml

### `Senai HUB/backend/app/Services/Reports/GridReportBuilderService.php` (351 linhas)
Métodos públicos: build

### `Senai HUB/backend/app/Services/Safe/SafeConnectStudentBridge.php` (101 linhas)
Métodos públicos: paginate, ensureSafeStudentRecord, resolveSafeStudent

### `Senai HUB/backend/app/Services/Safe/SafeWorkflowService.php` (260 linhas)
Métodos públicos: __construct, createAuthorization, updateAuthorization, approveByTeacher, denyByTeacher, confirmByPortaria, denyByPortaria, parseScheduledAt, generateProtocol, logAction

### `Senai HUB/backend/app/Services/Search/GlobalSearchService.php` (185 linhas)
Métodos públicos: __construct, search

### `Senai HUB/backend/app/Services/Spreadsheet/ConnectSpreadsheetHandler.php` (679 linhas)
Métodos públicos: __construct, export, import

### `Senai HUB/backend/app/Services/Spreadsheet/GridSpreadsheetHandler.php` (314 linhas)
Métodos públicos: export, import

### `Senai HUB/backend/app/Services/Spreadsheet/SpreadsheetService.php` (196 linhas)
Métodos públicos: __construct, listModule, downloadTemplate, export, preview, import, importLogs

## Seção 16 — Fluxos de negócio

### Fluxo acadêmico Connect

```text
Pessoa (hub_people)
  → Aluno/Professor (connect_students / connect_teachers)
  → Curso + Turma (connect_courses / connect_classes)
  → Padrão semanal (connect_class_weekly_patterns)
  → Aulas (connect_lesson_schedules)
  → Sessão de frequência (connect_attendance_sessions)
  → Marcações (connect_attendance_marks)
  → Contrato (connect_contracts) → Salário (connect_salary_records)
```

Serviços: `ConnectEnrollmentService`, `ConnectScheduleService`, `ConnectAttendanceService`.

### Fluxo de chamado Grid

```text
Aberto → Em atendimento → Aguardando aprovação → Em avaliação → Concluído
         ↘ Tarefas Kanban (grid_tasks) + reservas de estoque (grid_inventory_reservations)
```

Implementação: `GridWorkflowService.php` (L1–L619). Status em `grid_tickets.status`.

### Fluxo SAFE (autorização)

```text
AQV cria (pendente)
  → Professor aprova → (saída) aguarda portaria → portaria confirma → finalizado
  → Professor nega → negado
  → Portaria nega na saída → negado
```

Implementação: `SafeWorkflowService.php` (L1–L260). Auditoria em `safe_authorization_logs`.

### Funcionalidades complementares (subtelas e painéis)

### SUB-01. Painel acesso pendente

| Campo | Valor |
|---|---|
| **Módulo** | Hub |
| **Rota UI** | `/hub` |
| **Permissão** | — |

**O que é / o que faz:** Usuário unassigned vê instruções até admin liberar apps.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/hub/PendingAccessPanel.tsx` (L1–L33) |

---

### SUB-02. Aba cadastros no dashboard Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | — |

**O que é / o que faz:** Tabela de alunos recém-cadastrados.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### SUB-03. Aba alertas no dashboard Connect

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | — |

**O que é / o que faz:** Alertas operacionais do Connect.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### SUB-04. Gráfico frequência (donut)

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | — |

**O que é / o que faz:** Distribuição presente/FJ/FI; total_records real.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### SUB-05. Gráfico sessões por professor

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | — |

**O que é / o que faz:** Barras com aulas ministradas na semana.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### SUB-06. Gráfico alunos por curso

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `/connect` |
| **Permissão** | — |

**O que é / o que faz:** Barras horizontais de matrículas.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### SUB-07. Painel padrão semanal da turma

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `Turmas/Calendário` |
| **Permissão** | — |

**O que é / o que faz:** Sincroniza padrões, gera calendário, provisiona frequência.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/connect/ClassSchedulePanel.tsx` (L1–L232) |

---

### SUB-08. Drawer aprovar serviço Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/chamados` |
| **Permissão** | — |

**O que é / o que faz:** Transição pós-execução técnica.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/grid/GridApproveServiceDrawer.tsx` (L1–L84) |

---

### SUB-09. Drawer avaliar chamado Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/chamados` |
| **Permissão** | — |

**O que é / o que faz:** Nota e comentário final.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/grid/GridEvaluateTicketDrawer.tsx` (L1–L92) |

---

### SUB-10. Drawer criar tarefa do chamado

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/chamados` |
| **Permissão** | — |

**O que é / o que faz:** Kanban task + materiais.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/grid/GridCreateTaskFromTicketDrawer.tsx` (L1–L196) |

---

### SUB-11. Anexos de chamado Grid

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid` |
| **Permissão** | — |

**O que é / o que faz:** Upload/listagem de arquivos.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/grid/GridTicketAttachmentsPanel.tsx` (L1–L263) |

---

### SUB-12. Seletor de estoque em tarefas

| Campo | Valor |
|---|---|
| **Módulo** | Grid |
| **Rota UI** | `/grid/tarefas` |
| **Permissão** | — |

**O que é / o que faz:** Picker de itens com reserva.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/components/grid/GridInventoryPicker.tsx` (L1–L186) |

---

### SUB-13. Mapa 3D do campus

| Campo | Valor |
|---|---|
| **Módulo** | Connect/Grid |
| **Rota UI** | `localização/mapa` |
| **Permissão** | — |

**O que é / o que faz:** Viewer Three.js do campus.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `components/connect/CampusMap3DViewer.tsx` |

---

### SUB-14. E-mail transacional

| Campo | Valor |
|---|---|
| **Módulo** | Global |
| **Rota UI** | `—` |
| **Permissão** | — |

**O que é / o que faz:** Envio de e-mails de notificação e reset de senha.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Notification/HubMailDispatcher.php` |

---

### SUB-15. Template PDF contrato padrão

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `contratos` |
| **Permissão** | — |

**O que é / o que faz:** HTML/PDF com lacunas nome, curso, empresa.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/backend/resources/views/contracts/default.blade.php` (L1–L127) |

---

### SUB-16. Provisionamento calendário semestre

| Campo | Valor |
|---|---|
| **Módulo** | Connect |
| **Rota UI** | `cursos/turmas` |
| **Permissão** | — |

**O que é / o que faz:** Aulas padrão ao criar curso com período.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Código | `Senai HUB/frontend/src/pages/connect/ConnectOverviewPage.tsx` (L1–L219) |

---

### Seções da landing page (detalhe)

### PUB-01a. Hero landing

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Seção da landing: Hero.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Componente | `Senai HUB/frontend/src/components/landing/LandingHero.tsx` (L1–L88) |

---

### PUB-01b. Recursos landing

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Seção da landing: Recursos.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Componente | `Senai HUB/frontend/src/components/landing/LandingFeatures.tsx` (L1–L53) |

---

### PUB-01c. Público-alvo landing

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Seção da landing: Público-alvo.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Componente | `Senai HUB/frontend/src/components/landing/LandingAudience.tsx` (L1–L63) |

---

### PUB-01d. Preview mockup Hub

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Seção da landing: Preview mockup Hub.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Componente | `Senai HUB/frontend/src/components/landing/HubPreviewMockup.tsx` (L1–L87) |

---

### PUB-01e. CTA landing

| Campo | Valor |
|---|---|
| **Módulo** | Público |
| **Rota UI** | `/` |

**O que é / o que faz:** Seção da landing: CTA.

**Referências no código:**

| Camada | Arquivo (linhas) |
|---|---|
| Componente | `Senai HUB/frontend/src/components/landing/LandingCta.tsx` (L1–L34) |

---

## Anexo D — Serviços frontend

| Service | Arquivo | Responsabilidade |
|---|---|---|
| `api` | `Senai HUB/frontend/src/services/api.ts` (48 linhas) | Cliente Axios + interceptors 401 |
| `authService` | `Senai HUB/frontend/src/services/authService.ts` (71 linhas) | Login, logout, perfil, senha, avatar |
| `applicationService` | `Senai HUB/frontend/src/services/applicationService.ts` (8 linhas) | GET /applications |
| `adminService` | `Senai HUB/frontend/src/services/adminService.ts` (83 linhas) | CRUD usuários admin |
| `connectService` | `Senai HUB/frontend/src/services/connectService.ts` (444 linhas) | Todas as APIs Connect |
| `gridService` | `Senai HUB/frontend/src/services/gridService.ts` (212 linhas) | Todas as APIs Grid |
| `safeService` | `Senai HUB/frontend/src/services/safeService.ts` (96 linhas) | Todas as APIs SAFE |
| `archiveService` | `Senai HUB/frontend/src/services/archiveService.ts` (56 linhas) | Arquivo histórico |
| `reportService` | `Senai HUB/frontend/src/services/reportService.ts` (146 linhas) | Relatórios customizados export |
| `reportPresetService` | `Senai HUB/frontend/src/services/reportPresetService.ts` (29 linhas) | Presets de relatório |
| `spreadsheetService` | `Senai HUB/frontend/src/services/spreadsheetService.ts` (100 linhas) | Import/export planilhas |
| `notificationService` | `Senai HUB/frontend/src/services/notificationService.ts` (55 linhas) | Notificações e preferências |
| `searchService` | `Senai HUB/frontend/src/services/searchService.ts` (25 linhas) | Busca global |
| `accessRequestService` | `Senai HUB/frontend/src/services/accessRequestService.ts` (12 linhas) | Solicitação de acesso |
| `publicConfigService` | `Senai HUB/frontend/src/services/publicConfigService.ts` (17 linhas) | Config pública mapa |
| `healthService` | `Senai HUB/frontend/src/services/healthService.ts` (8 linhas) | Health check |
| `permissionsCatalogService` | `Senai HUB/frontend/src/services/permissionsCatalogService.ts` (45 linhas) | Catálogo de permissões |

## Anexo E — Comandos Artisan

| Comando | Arquivo | Função |
|---|---|---|
| `php artisan connect:sync-class-schedules` | `Senai HUB/backend/app/Console/Commands/SyncConnectClassSchedules.php` | Sincroniza calendário de turmas |
| `php artisan connect:archive-expired-classes` | `Senai HUB/backend/app/Console/Commands/ArchiveExpiredConnectClasses.php` | Arquiva turmas com data fim vencida |
| `php artisan permissions:sync-frontend` | `Senai HUB/backend/app/Console/Commands/SyncPermissionsFrontendCommand.php` | Sincroniza permissões com frontend |
| `php artisan grid:merge-inventory-duplicates` | `Senai HUB/backend/app/Console/Commands/MergeGridInventoryDuplicates.php` | Mescla itens duplicados no estoque |
| `php artisan grid:sync-inventory-images` | `Senai HUB/backend/app/Console/Commands/SyncGridInventoryImages.php` | Busca imagens Wikimedia para estoque |
| `php artisan grid:purge-demo-data` | `Senai HUB/backend/app/Console/Commands/PurgeGridDemoData.php` | Remove dados demo do Grid |

## Anexo F — Catálogo de planilhas

Fonte: `backend/app/Support/Spreadsheet/SpreadsheetRegistry.php`.

### Connect

| key | Descrição | Import | Export |
|---|---|---|---|
| people | Pessoas (cadastro global) | sim | sim |
| students | Alunos | sim | sim |
| teachers | Professores | sim | sim |
| courses | Cursos | sim | sim |
| classes | Turmas | sim | sim |
| contracts | Contratos | sim | sim |
| attendance | Marcações de frequência | sim | sim |
| attendance_sessions | Sessões de frequência | não | sim |

### Grid

| key | Descrição | Import | Export |
|---|---|---|---|
| users | Usuários Grid | sim | sim |
| inventory | Estoque | sim | sim |
| tickets | Chamados | sim | sim |

## Anexo G — Layouts e componentes estruturais

| Componente | Arquivo | Função |
|---|---|---|
| `HubLayout` | `Senai HUB/frontend/src/layouts/HubLayout.tsx` | Shell Hub + sidebar |
| `ConnectLayout` | `Senai HUB/frontend/src/layouts/ConnectLayout.tsx` | Shell Connect |
| `GridLayout` | `Senai HUB/frontend/src/layouts/GridLayout.tsx` | Shell Grid |
| `SafeLayout` | `Senai HUB/frontend/src/components/safe/SafeLayout.tsx` | Shell SAFE |
| `AuthLayout` | `Senai HUB/frontend/src/layouts/AuthLayout.tsx` | Telas de login |
| `GlassShell` | `Senai HUB/frontend/src/components/layout/GlassShell.tsx` | Fundo glass + wallpaper |
| `HubHeader` | `Senai HUB/frontend/src/components/hub/HubHeader.tsx` | Header Hub |
| `ConnectHeader` | `Senai HUB/frontend/src/components/connect/ConnectHeader.tsx` | Header Connect + busca |
| `GridHeader` | `Senai HUB/frontend/src/components/grid/GridHeader.tsx` | Header Grid |
| `SafeHeader` | `Senai HUB/frontend/src/components/safe/SafeHeader.tsx` | Header SAFE |
| `ProtectedRoute` | `Senai HUB/frontend/src/routes/ProtectedRoute.tsx` | Exige autenticação |
| `ModuleAccessRoute` | `Senai HUB/frontend/src/routes/ModuleAccessRoute.tsx` | Exige connect/grid/safe.access |
| `PermissionRoute` | `Senai HUB/frontend/src/routes/PermissionRoute.tsx` | Filtra por nav permission |
| `AdminRoute` | `Senai HUB/frontend/src/routes/AdminRoute.tsx` | Somente admin |

## Apêndice — Roteiro de apresentação

### Abertura sugerida

> O SENAI HUB é uma plataforma web que integra gestão acadêmica (Connect), manutenção (Grid) e controle de entrada/saída (SAFE). Login único com permissões por perfil. Frontend React/TypeScript, API Laravel/Sanctum.

### Ordem de demonstração recomendada

1. Landing pública → login
2. Hub launcher → Connect dashboard
3. Turma + calendário + frequência
4. Grid chamado → tarefa → estoque
5. SAFE autorização → aprovação → portaria
6. Relatório PDF + planilha + arquivo histórico
7. Perfil, temas, busca global, chat suporte

### Perguntas frequentes

- **É o mesmo backend do app mobile?** Não — o site usa Laravel; o app Expo usa Supabase (ver seção 3).
- **Onde ficam os dados?** Migrations em `backend/database/migrations/`; SQLite em dev.
- **Como adicionar permissão?** `config/permissions.php` + sync via artisan.

---

*Manual gerado e mantido com auxílio de `scripts/generate-system-manual.mjs` para referências de linha. Última atualização: 2026-06-16.*
