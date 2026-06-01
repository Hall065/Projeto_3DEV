# Melhorias sugeridas — SENAI HUB

Documento de backlog e roadmap com base no estado atual do sistema (Connect, Grid, planilhas, relatórios, autenticação Sanctum, **RBAC**, **busca global**, **configurações na API**).

---

## Prioridade alta (impacto + base sólida)

### 1. ~~Permissões de verdade (RBAC)~~ — concluído

- [x] Papéis por módulo com um cargo por conta
- [x] Bloqueio de rotas no frontend e endpoints no backend (`permission` / `admin` middleware)
- [x] Gestão de usuários pelo admin (criar conta + atribuir perfil)
- [x] Menus Connect/Grid filtrados por permissão; acesso ao módulo via `ModuleAccessRoute`
- [x] Escopo de dados em alunos/turmas/frequência (`UserAccessScope`)

**Onde:** `config/permissions.php`, `/hub/usuarios`, `/api/admin/users`.

---

### 2. ~~Busca global funcional~~ — concluído

- [x] API `GET /api/search?q=` com resultados por permissão (alunos, turmas, chamados, estoque)
- [x] Command palette no front (`Ctrl+K`) + botão nos headers Connect, Grid e Hub
- [x] Resultados agrupados por módulo com link direto (`GlobalSearchPalette`)

**Pendente (opcional):** buscar também cursos, pessoas, tarefas Grid; highlight automático na tela de destino.

---

### 3. Notificações e alertas operacionais

Connect já tem `ConnectAlert`; Grid tem fluxo longo (aberto → aprovação → avaliação).

**Sugestão:**

- Alertas na UI (ícone de sino) + opcional e-mail
- Exemplos: chamado urgente sem técnico; estoque abaixo do mínimo; turma com presença abaixo de X%

---

### 4. Qualidade e deploy previsível

**Sugestão:**

- Testes automatizados: login, frequência, chamado, import CSV/XLSX, RBAC, busca global
- `docker-compose` (PHP + banco + Vite) e README “subir em 1 comando”
- CI rodando `migrate` + testes

---

## Prioridade média (produto mais completo)

### 5. ~~Relatórios — construtor funcional~~ — concluído (uso diário)

- [x] Presets salvos no servidor (`report_presets`, API `/api/reports/{module}/presets`)
- [x] UI no construtor: salvar, carregar e excluir presets por usuário
- [x] Preview, export CSV e export HTML/PDF no navegador (`build`, `export-csv`, `export-html`)
- [x] Template de impressão alinhado ao payload (`reports/print.blade.php`)
- [x] Connect: aba Resumo (`/connect/reports/summary`) + Construtor em `/connect/relatorio`
- [x] Grid: construtor em `/grid/relatorios` com filtros (bloco, status, prioridade, etc.)
- [x] Permissões e escopo RBAC nos endpoints e dados Connect (`UserAccessScope`)

**Pendente (evolução):** PDF binário no servidor (DomPDF); agendamento por e-mail; presets compartilhados (`is_shared` no modelo).

---

### 6. ~~Planilhas — refinamento~~ — concluído

- [x] Import **Excel (.xlsx)** além de CSV (`XlsxStream` + `SpreadsheetFileParser`)
- [x] Pré-visualização antes de importar (simulação com rollback, `POST .../preview`)
- [x] Log de importações (`spreadsheet_import_logs`, `GET .../import-logs`, tabela na UI)

**Pendente:** export também em XLSX; auditoria detalhada por linha no log.

---

### 7. Connect — lacunas visíveis

| Área | Situação atual | Sugestão |
|------|----------------|----------|
| **Localização** | Tela com “mapa em breve” | Mapa com pins dos alunos + filtro por turma |
| **Salário** | API e tela existentes (só admin) | Regras claras, holerite exportável, histórico |
| **Portal do aluno** | Perfil `connect_aluno` com menu reduzido | Frequência própria, contrato, documentos |
| **Matrícula em lote** | Planilha de alunos | Wizard: curso → turma → importar |

---

### 8. Grid — operação de campo

**Sugestão:**

- PWA ou foco mobile para técnico (foto do reparo, assinatura, offline básico)
- Reserva de estoque amarrada à tarefa na UI
- SLA: tempo médio por prioridade, chamados estourados
- Técnico só editar chamados atribuídos (refinar escopo além do RBAC atual)

---

### 9. ~~Configurações e perfil integrados~~ — concluído

- [x] `PUT /api/auth/me` — nome e e-mail
- [x] `PUT /api/auth/password` — troca de senha com validação da senha atual
- [x] `SettingsPage` integrada à API (sem `localStorage` para perfil)

**Pendente:** preferências de notificação na API; tema já em `/temas` via `AppearanceContext`.

---

## Prioridade menor (diferenciais / médio prazo)

### 10. Auditoria

Tabela `audit_log`: frequência, chamados, planilhas, perfis de usuário.

### 11. Dashboard executivo único

KPIs Connect + Grid no Hub (`/hub`) para direção.

### 12. Integrações

AD/LDAP, OpenAPI, export BI.

### 13. Limpeza técnica

Páginas órfãs, toasts de erro, Filament admin.

---

## Roadmap sugerido (3 fases)

### Fase 1 — 2 a 4 semanas

- [x] RBAC básico
- [x] Busca global
- [ ] Testes + Docker
- [ ] Tratamento de erros consistente na UI

### Fase 2 — 1 a 2 meses

- Mapa de localização (Connect)
- Notificações (principalmente Grid)
- [x] Presets de relatório no servidor + HTML/PDF via navegador
- [x] Import Excel + pré-visualização + log
- SLA e métricas Grid
- [x] Configurações na API

### Fase 3 — contínuo

- Integrações, PWA técnico, auditoria, portal do aluno, BI

---

## Ordem recomendada para uso real

1. ~~**Permissões**~~ — feito
2. ~~**Busca global**~~ — feito
3. **Notificações Grid** — retorno rápido
4. **Mapa de localização Connect**
5. **Docker + testes**

---

## O que já foi implementado (referência)

| Funcionalidade | Onde |
|----------------|------|
| RBAC — perfis e permissões | `config/permissions.php`, `/hub/usuarios` |
| Busca global (`Ctrl+K`) | `GET /api/search`, `GlobalSearchPalette`, headers |
| Presets de relatório (servidor) | `/api/reports/{module}/presets`, construtor |
| Relatório HTML para PDF | `POST /api/reports/{module}/export-html` |
| Planilhas CSV + XLSX, preview, log | `/connect/planilhas`, `/grid/planilhas` |
| Configurações (perfil + senha) | `/configuracoes`, `PUT /auth/me`, `PUT /auth/password` |
| Relatórios personalizáveis | `/connect/relatorio`, Grid → Construtor |
| Import/export CSV legado | planilhas |
| Frequência | `/connect/frequencia` |
| Proxy Vite | `vite.config.ts` |

---

## Como usar este documento

- Marque itens concluídos com `[x]` ao implementar
- Priorize por módulo: **Connect**, **Grid** ou **infra**

_Última atualização: junho/2026 (busca global, relatórios, planilhas, configurações)_
