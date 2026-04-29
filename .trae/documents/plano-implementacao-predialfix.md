# Plano de Implementação — PredialFix (telas 1:1 + responsivas)

**Fontes de verdade**
- PRD base: `Arquivos/Implementações/PRD.md`
- Telas (referência visual): `Arquivos/Telas/*.png`

## 1) Mapa de páginas (MVP)
1. Home (welcome/entrada)
2. Login e Cadastro
3. Dashboard
4. Chamados
5. Tarefas
6. Estoque
7. Usuários
8. Relatórios

Referências:
- <img src="../../Arquivos/Telas/Login e Cadastro.png" style="max-width: 100%;" />
- <img src="../../Arquivos/Telas/Dashboard.png" style="max-width: 100%;" />
- <img src="../../Arquivos/Telas/Chamados.png" style="max-width: 100%;" />
- <img src="../../Arquivos/Telas/Tarefas.png" style="max-width: 100%;" />
- <img src="../../Arquivos/Telas/Estoque.png" style="max-width: 100%;" />
- <img src="../../Arquivos/Telas/Relátorios.png" style="max-width: 100%;" />

## 2) Componentes (inventário mínimo)
**Layout (reuso em todas as telas autenticadas)**
- `AppShell`: sidebar + topbar + container (desktop-first)
- `SidebarNav`: itens (Dashboard, Chamados, Tarefas, Estoque, Usuários, Relatórios)
- `Topbar`: título da página + ações globais + usuário/logout

**UI base**
- `CardStat` (KPIs), `DataTable` (tabela com cabeçalho/linhas), `Badge` (status/prioridade)
- `Button` (primário/secundário/perigo), `Input`, `Select`, `Textarea`, `DateInput`
- `Modal` (criar/editar), `ConfirmDialog` (exclusão), `Toast/Alert`
- `Pagination` (se necessário) + `EmptyState`

**Formulários por domínio**
- ChamadoForm: titulo, local, prioridade, status, descricao, id_usuario, id_atendente
- TarefaForm: titulo, localizacao, prioridade, status, datas, id_responsavel
- EstoqueForm: nome, categoria, localizacao, quantidade, status
- UsuarioForm: nome, email, cpf, perfil_acesso, ativo

## 3) Fluxos essenciais
### 3.1 Autenticação
- Entrar → valida credenciais → redireciona para Dashboard
- Cadastro → cria usuário → redireciona para Dashboard

### 3.2 Operação (CRUD)
- Dashboard → abrir módulo → listar → (criar | editar | atualizar status | excluir)
- Ações críticas com confirmação e feedback visual (alert/toast)

### 3.3 Permissões (mínimo)
- Sidebar exibe itens conforme `perfil_acesso`
- Restringir rotas/controller actions conforme perfil (ex.: cliente não gerencia Usuários)

## 4) Sequência de entrega (recomendado)
1. **Base visual (1:1)**: tokens (cores, tipografia), grid/spacing, AppShell, componentes base.
2. **Auth**: login/cadastro estilizados conforme a tela + proteção de rotas.
3. **Dashboard**: cards e atalhos (sem depender de relatórios complexos).
4. **CRUDs**: Chamados → Tarefas → Estoque → Usuários.
5. **Relatórios**: implementar apenas o que existir na tela (componentes de visualização).
6. **Responsividade**: ajustar breakpoints e estados (sidebar colapsável, tabelas com scroll).

## 5) Checklist 1:1 e responsivo
- Comparar espaçamentos e hierarquia tipográfica com `Arquivos/Telas/*.png`
- Estados: hover/focus/disabled/error
- Tabelas: overflow-x em telas menores; colunas essenciais priorizadas
- Acessibilidade: labels, aria, foco visível, contraste mínimo