# Sugestões de melhorias — SENAI HUB

Documento gerado com base na análise do código (backend Laravel, frontend React, Connect, Grid, auth e DevOps).  
Use como backlog de evolução do produto — itens ordenados por impacto.

**Legenda de status**

| Status | Significado |
|--------|-------------|
| ✅ **Implementado** | Entregue e funcional no repositório |
| 🔶 **Parcial** | Parte entregue; restante descrito em “Pendente” |
| ⏳ **Pendente** | Ainda não iniciado ou não alterado nesta rodada |

---

## Resumo executivo

O projeto evoluiu de uma base sólida (Connect + Grid) para uma **plataforma integrada com três módulos**: Connect, Grid e **SAFE** (controle de entradas/saídas escolares).

Nesta rodada de implementação (jun/2026) foram entregues:

- **Segurança e governança:** cadastro público removido, rate limit, TTL Sanctum, logout por token, redirect 401, recuperação de senha.
- **Escopo de dashboards:** Connect e Grid alinhados ao `UserAccessScope`.
- **Notificações e e-mail:** centro in-app ampliado, preferências por módulo (Hub, Connect, Grid, SAFE), envio via Laravel Mail com redirect para desenvolvimento.
- **Internacionalização:** pt-BR (padrão), en e es via `react-i18next` + locale backend `pt_BR`.
- **Novo módulo:** SAFE integrado ao Hub (API, permissões, seeders, frontend com logos de marca dedicados).

> **Nota:** O projeto `confeccaoTB` (BackEnd--2026) foi usado **apenas como referência** para o padrão de envio de e-mail (Laravel Mail). O módulo Ateliê/Confecção **não faz parte** do SENAI HUB e foi removido do repositório.

**Único gap remanescente:** tópico **24** (mobile/Supabase) — responsabilidade de outro integrante; pasta `Mobile/` fora de escopo.

---

## Registro de implementação (jun/2026 — continuação)

| Área | Entregas principais |
|------|---------------------|
| **DX** | `README.md` raiz, CI frontend+backend (`.github/workflows/ci.yml`), `frontend/.env.example`, `.gitignore` frontend |
| **Grid escopo** | Migration `assignee_user_id` / `requester_user_id` / `opened_by_user_id`, `GridParticipantSync`, escopo por ID com fallback por nome |
| **Qualidade** | Testes feature: auth, health, escopo Grid, SAFE; health check enriquecido |
| **Frontend UX** | Lazy-load mapa 3D/planilhas, `parseApiError`, refresh de sessão ao focar aba, tela “Aguardando liberação”, badge simulação mapa, skeleton boot |
| **Permissões** | `GET /api/auth/permissions-catalog` para sincronização backend→frontend |
| **Docs** | Busca global e usuários SAFE em `ACESSOS_PADRAO.md` |

| Área | Entregas principais (rodada 3 — jun/2026) |
|------|-------------------------------------------|
| **Solicitar acesso** | `POST /api/access-requests`, tela `/solicitar-acesso`, notificação admin |
| **Permissões runtime** | `permissionsCatalogService`, `useNavLabel`, sidebars Connect/Grid/SAFE |
| **i18n nav** | Namespace `nav.*` pt/en/es + `useNavLabel` |
| **Mapa demo** | `CAMPUS_MAP_SIMULATION`, `GET /api/public-config`, badge condicional |
| **Produto** | Export CSV relatórios Connect, preview temas na landing |
| **Filament** | Removido do `composer.json` e providers |
| **Testes** | `SafeWorkflowTest`, `AccessRequestTest`, `ConnectAccessScopeTest` |
| **E2E** | Playwright smoke (landing, login, solicitar acesso) + job CI |
| **UX erros** | `parseApiError` em Grid, SAFE e relatórios Connect |
| **SAFE logo** | Sidebar usa capa `cover-safe.png` em vez de ícone Shield |

| Área | Entregas principais (rodada 4 — jun/2026) |
|------|-------------------------------------------|
| **Mapa campus** | `GET /api/connect/campus-people` (dados reais; demo só com simulação) |
| **parseApiError** | Frequência, calendário, salário, planilhas, usuários Hub |
| **i18n SAFE** | Namespace `safe.*` nas páginas e sidebar do módulo |
| **Relatórios** | Export PDF (impressão) do resumo Connect |
| **Permissões TS** | `php artisan hub:sync-permissions-frontend` → `permissionKeys.ts` |
| **Testes** | `CampusMapTest`, e-mail em `AccessRequestTest` (Mail::fake) |
| **E2E** | Login autenticado + hub (`e2e/auth-hub.spec.ts`) |

| Área | Entregas principais (rodada 5 — jun/2026 — conclusão 100%) |
|------|--------------------------------------------------------------|
| **SAFE logos** | Assets `safe-logo-expanded.png`, `safe-logo-icon.png`, marks light/dark em `frontend/src/assets/brand/`; `SafeAppLogo` alinhado a Connect/Grid |
| **i18n Connect/Grid** | Namespaces `connect.*` e `grid.*` em pt/en/es; páginas internas migradas para `useTranslation()` |
| **parseApiError** | Páginas Connect CRUD, Grid Controle/Estoque/Chamados, Hub usuários e perfil |
| **Mapa 3D** | `campus_rooms` + `position` em `config/hub.php`; API retorna coordenadas; mapa usa posição real quando disponível |
| **Relatórios Excel** | `GET /connect/reports/summary/xlsx` + botão na aba Resumo |
| **Grid Controle** | Bloco D no formulário de novo chamado; fluxo workflow completo com `parseApiError` |
| **Permissões nav** | `nav_items` em `permissions.php` → `navManifest.ts` + `navIcons.ts`; rotas sincronizadas via artisan |
| **Testes e-mail** | `HubResetPasswordMail` (auth) e `HubNotificationMail` (SAFE) com `Mail::fake` |
| **E2E** | `grid-controle.spec.ts`, `safe-flow.spec.ts` |
| **Performance** | `useCachedQuery` nos dashboards Connect e Grid (TTL 60s) |
| **Acessibilidade** | Link “Ir para o conteúdo” (`SkipToMainLink`) + `id="main-content"` nos layouts |

| Área | Entregas principais |
|------|---------------------|
| **SAFE** | Migrations, models, enums, `SafeWorkflowService`, API `/api/safe/*`, roles `safe_aqv` / `safe_professor` / `safe_portaria`, frontend completo, notificações + e-mail no fluxo |
| **E-mails** | `HubNotificationMail`, `HubResetPasswordMail`, `HubMailDispatcher`, views Blade SENAI, redirect dev → `hall065.2022@gmail.com` (padrão inspirado no `confeccaoTB`) |
| **Auth** | Remoção de `/cadastro` e `POST /auth/register`; `/recuperar-senha` e `/redefinir-senha`; throttle login/reset |
| **i18n** | `frontend/src/i18n/` (pt, en, es), seletor em Configurações, auth traduzido |
| **Notificações** | `NotificationPreferences` com módulos `safe`; e-mail habilitável nas configurações; `SafeNotificationTriggers` |
| **Removido** | Módulo Ateliê/Confecção (`/atelier`, API, roles, seeders, tabelas) — migration `2026_06_12_000000_drop_atelier_module` |

Usuários de teste SAFE: ver seção **Referências** e `ACESSOS_PADRAO.md`.

---

## Prioridade alta

### 1. Alinhar escopo do dashboard Grid ao restante do módulo — ✅ Implementado

**Situação original:** `GridDashboardController` consultava `GridTicket::query()` globalmente enquanto o restante do módulo usava `UserAccessScope`.

**O que foi feito:**
- `GridDashboardController` passou a receber `$request->user()` e usar `UserAccessScope::gridTicketQuery()` e `gridTaskQuery()` em **todas** as agregações: KPIs, sparklines, trends, breakdowns, tickets recentes/urgentes, atividades de tarefas, gráficos por mês e por técnico.
- Inventário global permanece sem escopo por perfil (dados operacionais compartilhados entre perfis com permissão).

**Arquivos:** `backend/app/Http/Controllers/Api/Grid/DashboardController.php`

---

### 2. Filtrar dashboard Connect por perfil — ✅ Implementado

**Situação original:** KPIs principais já usavam escopo, mas atividades, alertas e sparklines eram globais.

**O que foi feito:**
- `computeKpiTrends()`, `computeKpiSparklines()` e gráfico de frequência passaram a usar queries escopadas via `UserAccessScope`.
- Adicionado `attendanceSessionQuery()` em `UserAccessScope` para taxa de frequência por período.
- `ConnectActivity` e `ConnectAlert`: exibidos apenas para **admin**, **connect_secretaria**, **connect_diretor** e **connect_aqv**; demais perfis recebem listas vazias e `pending_alerts: 0`.
- Professor, aluno e empresa veem KPIs/sparklines/trends apenas do seu escopo.

**Arquivos:** `Connect/DashboardController.php`, `UserAccessScope.php`

---

### 3. Revisar cadastro público (`/cadastro`) — ✅ Implementado

**Situação original:** Registro público criava `connect_aluno` automaticamente, conflitando com fluxo admin-only.

**O que foi feito:**
- Removida rota `POST /api/auth/register` e método `register` do `AuthController` / `AuthService`.
- Removidas rota `/cadastro`, `RegisterPage` e todos os links “Criar conta” na landing e login.
- Login informa que **cadastro é feito pelo administrador** em `/hub/usuarios`.
- CTAs da landing redirecionam para `/login`.
- **Solicitar acesso:** formulário público em `/solicitar-acesso` (`POST /api/access-requests`, throttle 5/min); admin recebe notificação in-app; links no login e na tela de aguardando liberação.

**Arquivos:** `AccessRequestController`, `RequestAccessPage.tsx`, migration `access_requests`.

---

### 4. Rate limiting em login e registro — ✅ Implementado

**O que foi feito:**
- `POST /auth/login` → `throttle:10,1` (10 tentativas/minuto).
- `POST /auth/forgot-password` e `POST /auth/reset-password` → `throttle:5,1`.
- Rota de registro removida (item 3).

**Arquivos:** `backend/routes/api.php`

---

### 5. Tokens Sanctum com expiração e logout por dispositivo — ✅ Implementado

**O que foi feito:**
- `config/sanctum.php`: `'expiration' => env('SANCTUM_TOKEN_EXPIRATION', 43200)` (30 dias).
- `AuthService::logout()` revoga **apenas** o token atual (`currentAccessToken()->delete()`), não todos os tokens do usuário.
- Reset de senha revoga todos os tokens do usuário (comportamento esperado de segurança).

**Arquivos:** `config/sanctum.php`, `AuthService.php`, `.env.example`

---

### 6. Redirecionar para login em 401 (frontend) — ✅ Implementado

**O que foi feito:**
- Interceptor em `api.ts`: em 401, limpa `localStorage` e redireciona para `/login?expired=1` (exceto nas próprias páginas de auth).
- `LoginPage` exibe aviso quando `expired=1`.

**Arquivos:** `frontend/src/services/api.ts`, `LoginPage.tsx`

---

### 7. Recuperação de senha — ✅ Implementado

**O que foi feito:**
- Backend: `POST /auth/forgot-password`, `POST /auth/reset-password`, `ForgotPasswordRequest`, `ResetPasswordRequest`.
- `HubResetPasswordMail` com link para `{FRONTEND_URL}/redefinir-senha?token=...&email=...`.
- Em dev, e-mail de reset também respeita `HUB_REDIRECT_ALL_MAIL`.
- Frontend: `/recuperar-senha` (`ForgotPasswordPage`), `/redefinir-senha` (`ResetPasswordPage`), link funcional no login.

**Arquivos:** `AuthController.php`, `AuthService.php`, `HubResetPasswordMail.php`, `resources/views/emails/reset-password.blade.php`

---

### 8. README de setup na raiz do projeto — ✅ Implementado

**O que foi feito:** `Senai HUB/README.md` com pré-requisitos, setup backend/frontend, variáveis, comandos, e-mail dev, administração, busca global e referências.

---

## Prioridade média

### 9. Ampliar cobertura de testes automatizados — ✅ Implementado

**O que foi feito:**
- `AuthFeatureTest` — login, registro removido, catálogo de permissões, logout por token, **reset senha com `HubResetPasswordMail`**.
- `HealthCheckTest` — DB, fila, versão.
- `GridAccessScopeTest` — escopo professor/técnico por perfil seed.
- `SafeModuleTest` — dashboard AQV, bloqueio professor/aluno Connect.
- `SafeWorkflowTest` — fluxo AQV → professor → portaria (entrada e saída); **e-mail SAFE com `Mail::fake`**.
- `AccessRequestTest` — formulário público + notificação admin + e-mail (`Mail::fake`).
- `ConnectAccessScopeTest` — aluno vê só seu registro; secretaria vê todos; atividades no dashboard por perfil.
- `CampusMapTest` — endpoint `/connect/campus-people` com coordenadas `position`, simulação on/off.

**Total:** 33 testes PHPUnit passando.

---

### 10. CI com frontend (TypeScript + build) — ✅ Implementado

**O que foi feito:** Workflow `Senai HUB/.github/workflows/ci.yml` com jobs `backend` (PHPUnit), `frontend` (`npm ci`, `lint`, `build`) e `e2e` (Playwright).

---

### 11. Escopo Grid por ID em vez de nome — ✅ Implementado

**O que foi feito:**
- Migration `2026_06_13_100000_add_user_ids_to_grid_tickets_and_tasks` com backfill por nome.
- `GridParticipantSync` preenche IDs ao criar/atualizar chamados e tarefas.
- `UserAccessScope` usa `*_user_id` com fallback para colunas de nome (dados legados).

**Arquivos:** migration, `GridParticipantSync.php`, `UserAccessScope.php`, controllers Grid.

---

### 12. Sincronizar permissões backend ↔ frontend — ✅ Implementado

**O que foi feito:**
- Roles/permissões SAFE em `permissions.php` e `navPermissions.ts`.
- **`GET /api/auth/permissions-catalog`** expõe `roles`, `role_permissions`, `nav_permissions` e `application_slugs_by_role`.
- Frontend consome catálogo após login (`permissionsCatalogService`, `usePermissionCatalog`, `useNavLabel`); sidebars Connect/Grid/SAFE usam labels do catálogo + i18n.
- Comando **`php artisan hub:sync-permissions-frontend`** gera:
  - `frontend/src/generated/permissionKeys.ts`
  - `frontend/src/generated/navManifest.ts` (rotas, ícones e permissões por item de nav)
- `navPermissions.ts` monta itens a partir do manifest + `navIcons.ts`.

---

### 13. Lazy-load de páginas pesadas (mapa 3D) — ✅ Implementado

**O que foi feito:** `React.lazy` + `Suspense` para `/connect/localizacao`, `/grid/mapa` e planilhas Connect/Grid. Chunk separado `CampusMap3DViewer` (~642 kB) no build.

**Arquivos:** `frontend/src/routes/index.tsx`, `PageLoader.tsx`

---

### 14. Tratamento de erro padronizado no frontend — ✅ Implementado

**O que foi feito:** `parseApiError` usado em Hub, auth, relatórios, Grid (incl. Controle, Estoque, Chamados), SAFE, frequência, calendário, salário, planilhas, usuários Hub e **páginas Connect de cadastro** (turmas, alunos, contratos, professores, cursos, pessoas).

---

### 15. Atualizar permissões do usuário sem novo login — ✅ Implementado

**O que foi feito:** `AuthContext` revalida `/auth/me` quando a aba/janela recebe foco (`focus` + `visibilitychange`), atualizando `localStorage` e estado React.

---

### 16. Mapa de localização: separar dado real de simulação — ✅ Implementado

**O que foi feito:**
- Badge `MapSimulationBadge` em Connect Localização e Grid Mapa.
- Toggle via `CAMPUS_MAP_SIMULATION` + `GET /api/public-config` (`campus_map_simulation`, `campus_blocks`).
- Metadados dos blocos A–D centralizados em `config/hub.php` com **posição 3D por bloco**.
- **`GET /api/connect/campus-people`** — posições derivadas de alunos/professores reais; extras de demo só com `CAMPUS_MAP_SIMULATION=true`.
- **`campus_rooms`** em `config/hub.php` com coordenadas X/Y/Z por sala; API retorna `position`; mapa 3D posiciona pins nas coordenadas reais (fallback por hash quando sala não catalogada).

---

### 17. Filament: usar ou remover — ✅ Implementado

**O que foi feito:** Dependência Filament removida de `composer.json`, `AdminPanelProvider` e `bootstrap/providers.php`. Gestão 100% pela SPA React em `/hub/usuarios`. README documenta a decisão.

**Nota:** Rodar `composer update` localmente para limpar pacotes do `vendor/`.

---

### 18. `.env.example` e `.gitignore` do frontend — ✅ Implementado

**Backend:** bloco comentado de produção + `APP_VERSION` no `.env.example`.

**Frontend:** `frontend/.env.example` (`VITE_API_URL` opcional); `.gitignore` inclui `.env` e `.env.*` (exceto `.env.example`).

---

## Prioridade baixa

### 19. Locale `pt_BR` no backend — ✅ Implementado

**O que foi feito:** `.env.example` padronizado para `pt_BR`. Mensagens da API permanecem em português.

---

### 20. Health check enriquecido — ✅ Implementado

**O que foi feito:** `HealthService` retorna `version`, `environment`, `timestamp`, status de **database** e **queue** (driver + jobs pendentes quando `database`).

**Endpoint:** `GET /api/health`

---

### 21. Testes E2E (Playwright/Vitest) — ✅ Implementado

**O que foi feito:**
- `@playwright/test` + `playwright.config.ts` (dev + preview no CI).
- Smoke: landing, login, solicitar acesso (mock API).
- **Login autenticado + hub** (`e2e/auth-hub.spec.ts`) com mocks de API.
- **Grid Controle** (`e2e/grid-controle.spec.ts`) — lista de chamados e painel de workflow.
- **SAFE** (`e2e/safe-flow.spec.ts`) — dashboard e listagem de autorizações.

---

### 22. UX para usuário `unassigned` — ✅ Implementado

**O que foi feito:** `PendingAccessPanel` no Hub quando `role === unassigned` ou sem `application_slugs`. Textos i18n pt/en/es.

---

### 23. Busca global documentada — ✅ Implementado

**O que foi feito:** Seção **Busca global** em `ACESSOS_PADRAO.md` (atalho Ctrl+K, endpoint, escopo por módulo/perfil).

---

### 24. Estratégia mobile vs API Laravel — ⏳ Pendente (outro integrante)

**Situação:** App mobile usa Supabase; API Hub usa Sanctum. **Não alterado** — escopo definido para outro membro da equipe. **Não modificar pasta `Mobile/`.**

**Sugestão mantida:** Documentar produtos distintos ou unificação futura de auth.

---

## Novos módulos integrados (fora do documento original)

### 25. SENAI SAFE — ✅ Implementado

**Origem:** Projeto `BackEnd--2026/Somativa SAFE - TB2/safe`.

**O que foi feito:**
- **Backend:** tabelas `safe_students`, `safe_authorizations`, `safe_authorization_logs`; fluxo AQV → Professor → Portaria (entrada/saída); API prefix `safe`; permissões `safe.access`, `safe.dashboard`, `safe.students.manage`, `safe.authorizations.manage`, `safe.approve`, `safe.portaria`.
- **Frontend:** layout, sidebar, páginas dashboard, alunos, autorizações, aprovações, portaria, detalhe; `safeService.ts`, tipos, rotas protegidas.
- **Notificações:** `SafeNotificationTriggers` integrado ao `SafeWorkflowService` (criação, aprovação professor, portaria).
- **Seeder:** usuários `ana.aqv@safe.senai.local`, `marcos.professor@safe.senai.local`, `helena.portaria@safe.senai.local` (senha `password123`).
- **Logos:** `safe-logo-expanded.png`, `safe-logo-icon.png`, marks light/dark em `frontend/src/assets/brand/`; `SafeAppLogo` na sidebar (padrão Connect/Grid); capa `cover-safe.png` no Hub.
- **E2E:** fluxo SAFE com mocks (`e2e/safe-flow.spec.ts`).

---

### 26. Sistema de e-mails (Laravel Mail) — ✅ Implementado

**Origem:** Apenas o **padrão de envio** do `confeccaoTB` (BackEnd--2026): `AtelierMail` + `AtelierNotifier` → portados para `HubNotificationMail` + `HubMailDispatcher`. **Nenhum ERP, rota, model ou tela** do confecção foi integrado.

**Como funciona no Hub inteiro:**
- Todo `NotificationService::notify()` dispara e-mail quando o usuário tem preferência `email` ativa para o módulo (Hub, Connect, Grid, SAFE).
- Reset de senha usa `HubResetPasswordMail` com o mesmo redirect dev (`HUB_REDIRECT_ALL_MAIL`).
- Em dev, todos os e-mails vão para `HUB_NOTIFICATION_EMAIL` (padrão `hall065.2022@gmail.com`).
- Corpo do e-mail é **menos detalhado** que a notificação in-app: resumo + linha de responsabilidade por módulo.

**Arquivos:** `HubMailDispatcher.php`, `HubNotificationMail.php`, `HubResetPasswordMail.php`, `config/hub.php`, `resources/views/emails/`

---

### 27. Internacionalização (i18n) — ✅ Implementado

**O que foi feito:**
- `react-i18next` com locales **pt** (padrão), **en** e **es** em `frontend/src/i18n/locales/`.
- Seletor de idioma em **Configurações** (`LanguageSwitcher`); preferência salva em `localStorage`.
- Traduções para **auth**, **Hub**, **nav**, solicitar acesso, landing, **SAFE**, **Connect** (overview, cadastros, frequência, relatórios, localização, etc.) e **Grid** (dashboard, controle, chamados, tarefas, estoque, mapa).

---

## Melhorias de produto/UX (quick wins)

| Área | Status | O que foi feito |
|------|--------|-----------------|
| **Notificações** | ✅ | Centro in-app (sino) ativo; preferências por módulo incl. SAFE; e-mail habilitável; triggers ampliados |
| **Grid — Controle** | ✅ | Página `/grid/controle` com workflow por etapa, bloco D no formulário, `parseApiError` e i18n |
| **Connect — Relatórios** | ✅ | Export CSV + PDF (impressão) + **Excel (.xlsx)** do resumo |
| **Temas** | ✅ | Preview na landing (`LandingThemesPreview`) |
| **Solicitar acesso** | ✅ | Formulário público + API + notificação admin |
| **Acessibilidade** | ✅ | Skeleton `AppBootSkeleton`; link skip-to-main nos layouts Hub/Connect/Grid/SAFE |
| **Performance** | ✅ | Lazy-load mapa 3D; refresh sessão ao focar aba; cache 60s nos dashboards Connect/Grid |

---

## Roadmap sugerido (atualizado)

### Concluído (jun/2026)

1. ~~Sprint segurança~~ — rate limit, token TTL, 401 → login, remoção do `/cadastro`, recuperar senha
2. ~~Sprint escopo~~ — dashboards Connect/Grid alinhados ao `UserAccessScope`
3. ~~Sprint SAFE~~ — módulo completo backend + frontend + logos
4. ~~Sprint notificações/e-mail~~ — HubMail + preferências + triggers SAFE + testes Mail::fake
5. ~~Sprint i18n~~ — pt/en/es completo (Connect, Grid, SAFE, Hub, auth, nav)
6. ~~Remoção Ateliê~~ — módulo confecção retirado; mantido apenas padrão de e-mail do `confeccaoTB`
7. ~~Sprint acesso~~ — solicitar acesso, Filament removido, preview temas, export CSV/PDF/Excel Connect
8. ~~Sprint qualidade~~ — workflow SAFE, Connect escopo, Playwright (smoke + hub + grid + safe), parseApiError ampliado
9. ~~Sprint mapa~~ — campus-people API, coordenadas 3D por sala, badge simulação
10. ~~Sprint permissões~~ — permissionKeys.ts + navManifest.ts via artisan

### Próximo passo (outro integrante)

1. **Sprint mobile:** Supabase/roles (integrante responsável — **tópico 24**)

---

## Referências no repositório

| Tópico | Onde olhar |
|--------|------------|
| Acessos de teste | `ACESSOS_PADRAO.md` |
| Permissões | `backend/config/permissions.php`, `frontend/src/config/navPermissions.ts` |
| Escopo por perfil | `backend/app/Support/UserAccessScope.php` |
| Auth API | `backend/routes/api.php`, `AuthController`, `AuthService` |
| E-mail / notificações | `HubMailDispatcher.php`, `NotificationService.php`, `SystemNotificationTriggers.php`, `SafeNotificationTriggers.php` |
| Config e-mail dev | `backend/config/hub.php`, `.env.example` |
| SAFE API | `backend/app/Http/Controllers/Api/Safe/`, `SafeWorkflowService.php` |
| SAFE logos | `Arquivos/Logo/Safe/`, `frontend/src/assets/brand/`, `SafeAppLogo.tsx` |
| Dashboard Connect | `Connect/DashboardController.php` |
| Dashboard Grid | `Grid/DashboardController.php` |
| Health check | `HealthService.php`, `GET /api/health` |
| Permissões (catálogo API) | `GET /api/auth/permissions-catalog` |
| i18n | `frontend/src/i18n/`, `LanguageSwitcher.tsx` |
| Frontend SAFE | `frontend/src/pages/safe/`, `components/safe/` |
| Workflow Grid | `GridWorkflowService.php` |
| Projeto fonte SAFE | `BackEnd--2026/Somativa SAFE - TB2/safe` |
| Interceptor HTTP | `frontend/src/services/api.ts` |
| Erros API (frontend) | `frontend/src/utils/parseApiError.ts` |
| Setup raiz | `Senai HUB/README.md` |
| CI | `.github/workflows/ci.yml` (backend, frontend, e2e) |
| Solicitar acesso | `/solicitar-acesso`, `POST /api/access-requests` |
| Campus mapa | `GET /api/connect/campus-people`, `ConnectCampusMapService`, `config/hub.php` (`campus_rooms`) |
| Permissões TS | `php artisan hub:sync-permissions-frontend` → `permissionKeys.ts`, `navManifest.ts` |
| E2E | `frontend/e2e/smoke.spec.ts`, `auth-hub.spec.ts`, `grid-controle.spec.ts`, `safe-flow.spec.ts` |
| Excel resumo Connect | `GET /api/connect/reports/summary/xlsx` |

---

*Última revisão: junho/2026 — rodada 5: conclusão 100% do backlog (exceto tópico 24 mobile). Logos SAFE, i18n Connect/Grid, coordenadas 3D, Excel resumo, nav sync, E2E grid/safe, testes e-mail, a11y skip-link, cache dashboards.*
