# PRD.md — SENAI HUB

**Projeto:** SENAI HUB  
**Aplicações internas:** SENAI Connect e SENAI Grid  
**Plataforma:** React + Expo  
**Banco de dados:** Supabase PostgreSQL  
**Autenticação:** Supabase Auth  
**Arquivos, imagens e vídeos:** Cloudinary + metadados no Supabase  
**Envio de e-mails:** Supabase Auth para fluxo padrão e Brevo apenas para e-mails transacionais/customizados  
**Data-base:** 23/05/2026  
**Objetivo deste arquivo:** orientar uma IA construtora a desenvolver o projeto completo com base nas telas, descrição funcional e estrutura de banco fornecidas.

---

## 1. Visão geral do produto

O **SENAI HUB** será uma aplicação mobile-first desenvolvida com **React Native + Expo**, organizada como um hub de acesso a dois sistemas internos:

1. **SENAI Connect**  
   Sistema acadêmico e administrativo para gerenciamento de alunos, professores, cursos, turmas, frequência, localização, contratos e salário de aprendizes.

2. **SENAI Grid**  
   Sistema de manutenção predial para abertura e acompanhamento de chamados, tarefas, estoque, mapa de tarefas, relatórios e usuários internos.

O usuário entra pela tela de login, autentica-se, passa pelo **Hub de Aplicações** e acessa somente os sistemas autorizados para seu perfil. Caso tenha acesso a apenas uma aplicação, o card correspondente deve aparecer centralizado.

---

## 2. Stack obrigatória

### 2.1 Front-end e mobile

- React Native com Expo.
- TypeScript obrigatório.
- Expo Router para navegação baseada em arquivos.
- Componentização reutilizável.
- Layout mobile-first, com possibilidade futura de adaptação para tablet/web via `react-native-web`.
- Tema visual baseado nas telas geradas:
  - SENAI Connect: branco, azul-marinho e vermelho.
  - SENAI Grid: azul-marinho, verde, branco e cards escuros ou claros conforme a tela.

### 2.2 Backend e banco de dados

- Supabase PostgreSQL como banco principal.
- Supabase Auth como mecanismo principal de login, sessão e recuperação de senha.
- Supabase Realtime para notificações, chamados, tarefas e localização quando necessário.
- Supabase Edge Functions para operações sensíveis que não podem rodar no app, como envio de e-mails customizados, geração de código de recuperação, assinatura Cloudinary e regras protegidas.
- Supabase RLS em todas as tabelas com dados sensíveis.

### 2.3 Arquivos, imagens e vídeos

- Cloudinary para armazenar:
  - fotos de perfil;
  - fotos de alunos/professores;
  - imagens anexadas a chamados;
  - vídeos anexados a chamados;
  - PDFs de contratos;
  - documentos de justificativa de falta.
- Supabase deve armazenar apenas os metadados do arquivo na tabela `hub.arquivos`:
  - URL segura;
  - `public_id` do Cloudinary;
  - tipo do arquivo;
  - tamanho;
  - usuário que enviou;
  - relação com aluno, chamado, contrato ou justificativa.

---

## 3. Decisão sobre recuperação/verificação de senha

### 3.1 Decisão principal

Utilizar **Supabase Auth** para autenticação, sessão e recuperação padrão de senha.

### 3.2 Quando usar Brevo

Utilizar **Brevo** apenas como serviço de envio de e-mail quando for necessário um fluxo personalizado, como:

- código numérico de recuperação de senha;
- e-mail de notificação de chamado;
- e-mail de contrato pendente;
- e-mail de alerta de estoque baixo;
- e-mail de autorização ou aviso interno.

### 3.3 Fluxo recomendado para o MVP

Para acelerar o desenvolvimento e reduzir risco de segurança, o MVP deve usar:

1. Usuário clica em **Recuperar senha**.
2. App chama `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
3. Usuário recebe e-mail de recuperação.
4. Link abre uma tela/deep link do app para redefinir senha.
5. App chama `supabase.auth.updateUser({ password: novaSenha })`.

### 3.4 Fluxo opcional com código numérico

Caso o projeto precise obrigatoriamente de código de 6 dígitos em vez de link:

1. App chama a Edge Function `auth-request-reset-code` com o e-mail.
2. Edge Function valida se o usuário existe.
3. Edge Function gera código de 6 dígitos.
4. Salva hash do código em `hub.tokens_recuperacao_senha` com expiração de 10 minutos.
5. Edge Function envia o código por Brevo.
6. Usuário digita código no app.
7. App chama `auth-verify-reset-code`.
8. Edge Function valida código e libera token temporário para alterar senha.
9. Edge Function altera senha via Admin API do Supabase.

**Importante:** o SMTP da Brevo nunca deve rodar dentro do aplicativo Expo. Credenciais de SMTP devem ficar apenas em Edge Functions ou servidor seguro.

---

## 4. Observação crítica de segurança sobre o ENV enviado

O arquivo `.env` do app deve conter apenas variáveis públicas. Como o prefixo `EXPO_PUBLIC_` fica disponível no bundle do aplicativo, não colocar senhas, SMTP, service role key, API secret da Cloudinary ou qualquer segredo no app.

### 4.1 Corrigir Supabase URL

O valor enviado contém `/rest/v1/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://nmaftnueudtwizccenrm.supabase.co/rest/v1/
```

Para usar `@supabase/supabase-js`, o valor correto deve ser a URL base do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://nmaftnueudtwizccenrm.supabase.co
```

### 4.2 `.env.example` recomendado

```env
# Supabase - público para uso no app
EXPO_PUBLIC_SUPABASE_URL=https://nmaftnueudtwizccenrm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=COLE_AQUI_A_CHAVE_PUBLISHABLE_OU_ANON

# Cloudinary - público apenas se usar upload unsigned
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=COLE_AQUI
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=COLE_AQUI

# Localização do SENAI Limeira / perímetro
EXPO_PUBLIC_SENAI_LATITUDE=-22.5648
EXPO_PUBLIC_SENAI_LONGITUDE=-47.4014
EXPO_PUBLIC_SENAI_RAIO_METROS=150

# Variáveis privadas - NÃO USAR NO EXPO PUBLIC
# Devem ficar no ambiente do Supabase Edge Functions ou backend seguro
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=COLE_AQUI
SMTP_EMAIL_FROM=contato_senaihub@hotmail.com
SMTP_PASS=ROTACIONAR_E_COLOCAR_APENAS_NO_BACKEND
CLOUDINARY_API_KEY=COLE_AQUI
CLOUDINARY_API_SECRET=COLE_AQUI
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI_APENAS_EDGE_FUNCTIONS
```

### 4.3 Ação obrigatória

A senha SMTP compartilhada no prompt deve ser **rotacionada imediatamente** antes de qualquer commit, deploy ou teste público.

---

## 5. Usuários e perfis

### 5.1 Tipos de usuário

O sistema deve trabalhar com os seguintes perfis principais:

- `admin`
- `aluno`
- `professor`
- `secretaria`
- `direcao`
- `empresa`
- `manutencao`
- `gerente_manutencao`

### 5.2 Aplicações por perfil

| Perfil | SENAI HUB | SENAI Connect | SENAI Grid |
|---|---:|---:|---:|
| Admin | Sim | Sim | Sim |
| Direção | Sim | Sim | Sim |
| Secretaria | Sim | Sim | Sim |
| Professor | Sim | Sim | Sim, apenas Chamados e acompanhamento dos próprios chamados |
| Aluno | Sim | Futuro app/aluno | Não |
| Empresa | Sim | Contratos e Salário | Não |
| Manutenção | Sim | Não | Tarefas, chamados atribuídos, estoque conforme permissão |
| Gerente de manutenção | Sim | Não | Completo no Grid |

### 5.3 Controle de acesso

A IA deve implementar RBAC usando:

- tabela `hub.usuario_aplicacoes` para liberar aplicações por usuário;
- tabela `hub.permissoes` para permissões granulares;
- tabela `hub.usuario_permissoes` para exceções;
- RLS no Supabase para impedir acesso direto indevido.

---

## 6. Estrutura de banco esperada

A estrutura fornecida está organizada em três schemas:

1. `hub` — base compartilhada.
2. `connect` — sistema acadêmico.
3. `grid` — sistema de manutenção.

### 6.1 Tabelas do schema `hub`

- `hub.usuarios`
- `hub.aplicacoes`
- `hub.usuario_aplicacoes`
- `hub.permissoes`
- `hub.usuario_permissoes`
- `hub.sessoes`
- `hub.tokens_recuperacao_senha`
- `hub.notificacoes`
- `hub.arquivos`
- `hub.blocos`
- `hub.salas`
- `hub.logs_acesso`

### 6.2 Tabelas do schema `connect`

- `connect.empresas`
- `connect.alunos`
- `connect.professores`
- `connect.cursos`
- `connect.turmas`
- `connect.turma_alunos`
- `connect.professor_turmas`
- `connect.aulas`
- `connect.frequencias`
- `connect.localizacoes_alunos`
- `connect.solicitacoes_localizacao`
- `connect.contratos_alunos`
- `connect.salarios_alunos`
- `connect.calculos_salario`

### 6.3 Tabelas do schema `grid`

- `grid.categorias_chamado`
- `grid.chamados`
- `grid.tarefas`
- `grid.historico_chamados`
- `grid.fornecedores`
- `grid.categorias_estoque`
- `grid.itens_estoque`
- `grid.movimentacoes_estoque`
- `grid.chamado_itens`
- `grid.solicitacoes_compra`
- `grid.anexos_chamado`
- `grid.relatorios_manutencao`

### 6.4 Ajuste necessário para Supabase Auth

A estrutura SQL possui `hub.usuarios.senha_hash`. Como o projeto usará Supabase Auth, a senha não deve ser salva manualmente nessa tabela.

A IA construtora deve escolher uma destas abordagens:

**Opção A — recomendada:**

- `hub.usuarios.id` deve ser o mesmo UUID de `auth.users.id`.
- Remover ou ignorar `senha_hash`.
- Dados pessoais e perfil ficam em `hub.usuarios`.
- Login, troca de senha e sessão ficam no Supabase Auth.

**Opção B — compatibilidade com SQL existente:**

- Adicionar `auth_user_id UUID UNIQUE REFERENCES auth.users(id)` em `hub.usuarios`.
- Tornar `senha_hash` opcional ou não usar no app.

---

## 7. Requisitos de interface global

### 7.1 Design system

- Usar componentes reutilizáveis:
  - `AppHeader`
  - `BottomNav`
  - `SidebarDrawer`
  - `MetricCard`
  - `DataCard`
  - `FilterBar`
  - `FormBottomSheet`
  - `StatusBadge`
  - `EmptyState`
  - `ConfirmDialog`
- Bordas arredondadas.
- Cards com sombra leve.
- Ícones consistentes.
- Tipografia limpa e legível.
- Espaçamento confortável para toque mobile.
- Responsividade para telas pequenas.

### 7.2 Cores principais

```ts
export const colors = {
  navy: '#001F3F',
  navyDark: '#00142B',
  red: '#E30613',
  green: '#00A859',
  blue: '#2563EB',
  orange: '#F59E0B',
  yellow: '#FACC15',
  grayText: '#64748B',
  border: '#E2E8F0',
  background: '#F8FAFC',
  white: '#FFFFFF',
};
```

---

## 8. Arquitetura de pastas recomendada

```txt
senai-hub-app/
├─ app/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  ├─ login.tsx
│  ├─ recuperar-senha.tsx
│  ├─ redefinir-senha.tsx
│  ├─ hub.tsx
│  ├─ connect/
│  │  ├─ _layout.tsx
│  │  ├─ index.tsx
│  │  ├─ alunos.tsx
│  │  ├─ professores.tsx
│  │  ├─ turmas.tsx
│  │  ├─ cursos.tsx
│  │  ├─ frequencia.tsx
│  │  ├─ gerenciar-frequencia.tsx
│  │  ├─ relatorios.tsx
│  │  ├─ localizacao.tsx
│  │  ├─ contratos.tsx
│  │  ├─ contrato-alunos.tsx
│  │  └─ salario.tsx
│  └─ grid/
│     ├─ _layout.tsx
│     ├─ index.tsx
│     ├─ chamados.tsx
│     ├─ tarefas.tsx
│     ├─ relatorios.tsx
│     ├─ estoque.tsx
│     ├─ mapa-tarefas.tsx
│     └─ usuarios.tsx
├─ src/
│  ├─ components/
│  │  ├─ common/
│  │  ├─ forms/
│  │  ├─ layout/
│  │  ├─ charts/
│  │  └─ maps/
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  ├─ cloudinary.ts
│  │  ├─ auth.ts
│  │  ├─ permissions.ts
│  │  └─ geofence.ts
│  ├─ services/
│  │  ├─ auth.service.ts
│  │  ├─ hub.service.ts
│  │  ├─ connect.service.ts
│  │  ├─ grid.service.ts
│  │  ├─ upload.service.ts
│  │  └─ notification.service.ts
│  ├─ stores/
│  │  ├─ auth.store.ts
│  │  ├─ app.store.ts
│  │  └─ filter.store.ts
│  ├─ types/
│  │  ├─ database.types.ts
│  │  ├─ auth.types.ts
│  │  ├─ connect.types.ts
│  │  └─ grid.types.ts
│  ├─ constants/
│  │  ├─ colors.ts
│  │  ├─ routes.ts
│  │  └─ roles.ts
│  └─ utils/
│     ├─ formatters.ts
│     ├─ validators.ts
│     └─ dates.ts
├─ supabase/
│  ├─ migrations/
│  └─ functions/
│     ├─ auth-request-reset-code/
│     ├─ auth-verify-reset-code/
│     ├─ cloudinary-sign-upload/
│     ├─ notify-email/
│     └─ calculate-salary/
├─ assets/
├─ .env.example
├─ package.json
└─ README.md
```

---

## 9. Bibliotecas recomendadas

```bash
npx create-expo-app senai-hub-app --template
npm install @supabase/supabase-js expo-router react-native-safe-area-context react-native-screens
npm install zustand react-hook-form zod @hookform/resolvers
npm install expo-image-picker expo-document-picker expo-file-system expo-location
npm install lucide-react-native react-native-svg
npm install date-fns
npm install cloudinary-react-native
```

Para gráficos, usar uma opção compatível com React Native:

```bash
npm install victory-native react-native-svg
```

---

## 10. Fluxo de autenticação

### 10.1 Login

Campos:

- e-mail institucional;
- senha;
- botão Entrar;
- link Recuperar senha.

Regras:

1. Validar e-mail e senha com Zod.
2. Chamar Supabase Auth.
3. Buscar perfil em `hub.usuarios`.
4. Buscar aplicações liberadas em `hub.usuario_aplicacoes`.
5. Redirecionar para `/hub`.
6. Se usuário estiver bloqueado ou inativo, impedir acesso.

### 10.2 Hub de aplicações

A tela deve exibir cards de aplicações:

- SENAI Connect;
- SENAI Grid.

Regras:

- Exibir apenas aplicações liberadas para o usuário.
- Se houver apenas uma aplicação, centralizar o card.
- Cada card deve ter imagem/ilustração, descrição e botão **Acessar aplicativo**.
- Menu do usuário deve conter:
  - Perfil;
  - Configurações;
  - Sair.

---

## 11. SENAI Connect — módulos

### 11.1 Visão geral

Dashboard inicial com:

- total de alunos cadastrados;
- professores cadastrados;
- turmas ativas;
- cursos ativos;
- frequência média do mês;
- contratos ativos;
- relatórios rápidos com gráficos;
- atividade recente;
- cadastros recentes e alertas.

### 11.2 Alunos

Funcionalidades:

- listar alunos;
- buscar por nome;
- filtrar por turma, idade, empresa, data de nascimento e status;
- criar aluno;
- editar aluno;
- inativar aluno;
- anexar foto via Cloudinary.

Campos do cadastro:

- nome;
- RM;
- CPF;
- e-mail pessoal;
- e-mail institucional;
- senha inicial;
- data de nascimento;
- foto;
- turma;
- curso;
- empresa;
- status;
- endereço;
- nome do responsável;
- celular;
- etnia.

Regras:

- Ao criar aluno, criar usuário no Supabase Auth.
- Criar registro em `hub.usuarios` com tipo `aluno`.
- Criar registro em `connect.alunos`.
- Vincular aluno à turma em `connect.turma_alunos` quando informado.

### 11.3 Professores

Funcionalidades:

- listar professores;
- buscar por nome, e-mail ou CPF;
- filtrar por status, especialidade e turma;
- criar professor;
- editar professor;
- inativar professor.

Campos:

- nome;
- CPF;
- e-mail pessoal;
- e-mail institucional;
- senha inicial;
- data de contratação;
- data de nascimento;
- turmas que dá aula;
- especialidade/disciplina;
- endereço;
- nome da mãe;
- nome do pai;
- celular;
- etnia;
- status;
- tempo de contrato.

### 11.4 Turmas

Funcionalidades:

- listar turmas;
- ver detalhes da turma;
- listar alunos da turma;
- criar turma;
- editar turma;
- excluir/inativar turma.

Campos:

- nome da turma;
- data de início;
- data de término;
- status;
- quantidade de alunos;
- período: manhã, tarde, noite ou integral;
- complemento do período por horário;
- bloco;
- sala;
- professor responsável;
- alunos;
- dia da semana;
- curso.

### 11.5 Cursos

Funcionalidades:

- listar cursos;
- criar curso;
- editar curso;
- remover/inativar curso;
- ao clicar em curso, listar alunos vinculados.

Campos:

- nome do curso;
- descrição;
- data de início;
- data de término;
- status;
- quantidade de alunos calculada automaticamente;
- período;
- horário de início;
- horário de fim;
- carga horária.

### 11.6 Frequência

Funcionalidades:

- professor registra frequência das turmas associadas a ele;
- selecionar turma;
- selecionar data;
- selecionar quantidade de aulas do dia: 1 a 5;
- marcar cada aluno por aula como:
  - Presente;
  - Falta justificada;
  - Falta injustificada.

Regras:

- Professor só pode registrar frequência de suas turmas.
- Secretaria e direção podem visualizar todas.
- Frequência gera histórico do aluno.
- Falta injustificada impacta cálculo salarial.
- Falta justificada não desconta salário, mas deve contar no relatório.

### 11.7 Gerenciar frequência

Funcionalidades:

- visualizar frequência por aluno, turma, período e status;
- exportar relatório;
- filtrar por período, turma, aluno e situação;
- cards com frequência, faltas justificadas, faltas injustificadas e status.

Permissões:

- Secretaria/direção: todos os alunos.
- Professor: alunos das suas turmas.
- Empresa: alunos contratados por ela.
- Aluno: somente a própria frequência em versão futura.

### 11.8 Relatórios Connect

Relatórios:

- frequência geral;
- aulas dadas na semana por professor;
- alunos por curso;
- cadastros recentes;
- alertas;
- contratos ativos;
- evolução da frequência mensal.

### 11.9 Localização

Funcionalidades:

- listar cursos;
- listar alunos do curso;
- exibir status do aluno:
  - presente;
  - atrasado;
  - ausente;
  - em aula;
  - dentro do perímetro;
- botão **Ver localização** apenas se aluno estiver dentro do perímetro do SENAI;
- mapa do campus com rota, bloco e sala atual.

Regras técnicas:

- Usar `expo-location` no app do aluno quando o módulo futuro for implementado.
- Geofence usando latitude, longitude e raio do `.env`.
- Salvar última localização em `connect.localizacoes_alunos`.
- Registrar acesso à localização em `hub.logs_acesso`.

### 11.10 Contratos

Área voltada para empresas parceiras.

Funcionalidades:

- empresa visualiza alunos contratados por ela;
- filtros por curso, aluno, empresa e status;
- visualização de documento PDF do contrato.

Campos exibidos:

- carga horária;
- curso;
- nome do aluno;
- e-mail pessoal;
- e-mail institucional;
- conta bancária;
- carteira de trabalho;
- documento digitalizado;
- status.

### 11.11 Contrato alunos

Área voltada para secretaria/direção.

Funcionalidades:

- criar contrato de aluno;
- vincular aluno à empresa;
- anexar contrato digitalizado via Cloudinary;
- editar status do contrato;
- listar contratos.

Campos:

- nome do aluno;
- nome da empresa;
- carteira do aluno;
- localização da empresa;
- carga horária;
- data de início;
- data de término;
- e-mail pessoal do aluno;
- e-mail institucional do aluno;
- e-mail da empresa;
- documento digitalizado;
- status.

### 11.12 Salário

Área voltada para empresa, secretaria/direção e futuramente aluno.

Funcionalidades:

- selecionar aluno;
- selecionar mês;
- preencher salário base;
- definir tipo de pagamento;
- definir carga diária;
- buscar frequência automaticamente;
- calcular faltas justificadas e injustificadas;
- calcular desconto por faltas;
- exibir salário final.

Fórmula sugerida:

```txt
valor_por_dia = salario_base / dias_uteis_mes
salario_final = salario_base - (valor_por_dia * faltas_injustificadas) - outros_descontos
frequencia_percentual = (dias_presentes / dias_uteis_mes) * 100
```

Regras:

- Faltas justificadas não descontam.
- Faltas injustificadas descontam.
- Empresa informa salário base e outros descontos.
- Sistema puxa frequência automaticamente.
- Resultado mensal é salvo em `connect.calculos_salario`.

---

## 12. SENAI Grid — módulos

### 12.1 Dashboard

Deve exibir:

- chamados abertos;
- chamados em andamento;
- concluídos no mês;
- itens com estoque baixo;
- chamados recentes;
- resumo de manutenção;
- tarefas por prioridade;
- itens urgentes;
- atividades em andamento.

### 12.2 Chamados

Funcionalidades para professor:

- abrir chamado;
- listar os próprios chamados;
- visualizar status;
- não editar após envio.

Formulário de abertura:

- título;
- descrição;
- sala;
- bloco;
- prioridade: baixa, média, alta ou urgente;
- anexos opcionais: foto/vídeo via Cloudinary.

Funcionalidades para gerente, secretaria e direção:

- visualizar todos os chamados;
- filtrar por status, prioridade, bloco, sala, data;
- atribuir responsável;
- atribuir item de estoque;
- alterar status;
- gerar tarefa.

Regras:

- Chamado criado inicia como `aberto`.
- Ao atribuir responsável, criar/atualizar tarefa em `grid.tarefas`.
- Se item for atribuído, reservar estoque via `grid.chamado_itens` e `grid.movimentacoes_estoque`.
- Se item não estiver disponível, abrir solicitação de compra.
- Compra até R$ 500,00: aprovação da secretaria.
- Compra acima de R$ 500,00: aprovação da direção.

### 12.3 Tarefas

Layout tipo Kanban adaptado para mobile:

- A fazer;
- Em andamento;
- Concluídas.

Campos da tarefa:

- ID do chamado;
- solicitante;
- título;
- descrição;
- sala;
- bloco;
- prioridade;
- status;
- data de abertura;
- início do reparo;
- término do reparo;
- responsável;
- item utilizado.

Regras:

- Manutenção vê apenas tarefas atribuídas a ela.
- Gerente vê todas.
- Ao iniciar, status muda para `em_andamento`.
- Ao concluir, status muda para `concluida` e registra data de término.
- Se item reservado não for utilizado, permitir **Retornar item ao estoque**.
- Se item for usado, registrar saída definitiva.

### 12.4 Relatórios Grid

Relatórios:

- manutenções no mês;
- itens comprados;
- custo total das manutenções;
- chamados concluídos;
- chamados urgentes;
- estoque baixo;
- manutenções por mês;
- tipos de manutenção;
- custo mensal;
- itens mais utilizados;
- custo por manutenção.

Permissões:

- gerente de manutenção;
- secretaria;
- direção;
- admin.

### 12.5 Estoque

Funcionalidades:

- listar itens;
- filtrar por categoria, nome, custo e status;
- adicionar item;
- editar item;
- adicionar quantidade comprada;
- remover quantidade;
- reservar item para chamado;
- retornar item ao estoque;
- visualizar estoque baixo.

Campos:

- título;
- descrição;
- categoria;
- quantidade disponível;
- quantidade mínima;
- localização: sala e bloco;
- fornecedor/empresa distribuidora;
- custo do item;
- status.

Regras:

- Se `quantidade_disponivel <= quantidade_minima`, status deve virar `estoque_baixo`.
- Itens reservados não devem aparecer como disponíveis para outra tarefa.
- Movimentações devem ser registradas em `grid.movimentacoes_estoque`.

### 12.6 Mapa de tarefas

Funcionalidades:

- exibir mapa do SENAI;
- mostrar tarefas a fazer e em andamento;
- pin por bloco/sala;
- lista abaixo do mapa com:
  - título;
  - responsável;
  - sala;
  - bloco;
  - status;
  - prioridade.

### 12.7 Usuários

Funcionalidades:

- cadastrar usuários internos;
- listar usuários;
- filtrar por nome, tipo, status e ID;
- editar;
- inativar;
- excluir apenas se não houver registros vinculados ou usar soft delete.

Campos:

- nome;
- e-mail institucional;
- telefone;
- senha inicial;
- tipo de usuário;
- data de criação automática;
- data de atualização automática;
- status padrão ativo;
- CPF.

Permissões:

- Somente direção, secretaria e admin acessam.

---

## 13. Notificações

Implementar notificações internas usando `hub.notificacoes`.

Eventos que geram notificação:

- novo chamado aberto;
- chamado atribuído;
- tarefa iniciada;
- tarefa concluída;
- item com estoque baixo;
- solicitação de compra aberta;
- frequência lançada;
- contrato cadastrado/renovado;
- salário calculado;
- solicitação de localização.

A interface deve mostrar sino com contador e tela/lista de notificações.

---

## 14. Uploads com Cloudinary

### 14.1 Tipos de upload

- Perfil: imagem.
- Aluno/professor: imagem.
- Chamado: imagem ou vídeo.
- Contrato: PDF.
- Justificativa de falta: PDF ou imagem.

### 14.2 Fluxo recomendado para MVP

1. App seleciona imagem/documento com Expo Image Picker ou Document Picker.
2. App envia para Cloudinary usando upload preset restrito.
3. Cloudinary retorna `secure_url`, `public_id`, `resource_type`, `format`, `bytes`.
4. App salva metadados em `hub.arquivos`.
5. Módulo relacionado referencia `hub.arquivos.id`.

### 14.3 Fluxo mais seguro

Para produção, usar Edge Function `cloudinary-sign-upload` para gerar assinatura e evitar upload unsigned amplo.

---

## 15. Requisitos não funcionais

- O app deve ser responsivo em telas Android e iOS.
- O tempo de carregamento inicial deve ser inferior a 3 segundos em conexão normal.
- Dados sensíveis devem ser protegidos por RLS.
- Nenhum segredo deve estar no app.
- Toda ação sensível deve gerar log em `hub.logs_acesso`.
- Todos os formulários devem ter validação com Zod.
- O código deve estar tipado com TypeScript.
- O app deve exibir loading, empty states e mensagens de erro.
- A interface deve estar em português brasileiro.
- Datas devem usar formato `dd/MM/yyyy`.
- Valores monetários devem usar `R$`.
- Todos os cadastros devem ter confirmação antes de excluir/inativar.

---

## 16. Regras de RLS sugeridas

A IA deve implementar políticas por perfil. Exemplos:

### 16.1 Professor

- Pode ler turmas associadas.
- Pode registrar frequência apenas de turmas associadas.
- Pode abrir chamados.
- Pode ler seus próprios chamados.
- Pode ler tarefas apenas se também possuir perfil de manutenção.

### 16.2 Secretaria

- Pode gerenciar alunos, professores, turmas, cursos, contratos e frequência.
- Pode acessar Connect completo.
- Pode visualizar Grid para controle administrativo.
- Pode aprovar compras até R$ 500,00.

### 16.3 Direção

- Pode visualizar relatórios completos.
- Pode aprovar compras acima de R$ 500,00.
- Pode acessar logs e dados sensíveis.

### 16.4 Empresa

- Pode ver apenas alunos vinculados à própria empresa.
- Pode visualizar contratos dos próprios alunos.
- Pode inserir dados salariais dos próprios alunos.

### 16.5 Manutenção

- Pode ver tarefas atribuídas.
- Pode atualizar status das próprias tarefas.
- Pode consultar itens necessários.

### 16.6 Gerente de manutenção

- Pode ver todos os chamados e tarefas.
- Pode atribuir responsável.
- Pode reservar item.
- Pode abrir solicitação de compra.
- Pode gerenciar estoque.

---

## 17. Telas obrigatórias

### 17.1 Globais

- Login.
- Recuperar senha.
- Redefinir senha.
- Hub de aplicações.
- Perfil/configurações.

### 17.2 SENAI Connect

- Visão geral.
- Alunos.
- Professores.
- Turmas e Cursos.
- Frequência.
- Gerenciar frequência.
- Relatórios.
- Localização.
- Contratos.
- Contrato alunos.
- Salário.

### 17.3 SENAI Grid

- Dashboard.
- Chamados.
- Tarefas.
- Relatórios.
- Estoque.
- Mapa de tarefas.
- Usuários.

---

## 18. Serviços e funções esperadas

### 18.1 Supabase client

Arquivo: `src/lib/supabase.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

Instalar dependência:

```bash
npm install @react-native-async-storage/async-storage
```

### 18.2 Edge Functions

Criar funções:

- `auth-request-reset-code` — opcional para código de recuperação.
- `auth-verify-reset-code` — opcional para validar código.
- `cloudinary-sign-upload` — gera assinatura de upload seguro.
- `notify-email` — envia e-mail por Brevo.
- `calculate-salary` — calcula e grava salário mensal.
- `create-user-profile` — cria usuário Auth + perfil em `hub.usuarios`.

---

## 19. Critérios de aceite

### 19.1 Login e hub

- Usuário consegue entrar com e-mail e senha.
- Usuário vê somente aplicações liberadas.
- Usuário consegue sair.
- Recuperação de senha funciona.

### 19.2 Connect

- Secretaria consegue cadastrar aluno, professor, curso e turma.
- Professor consegue lançar frequência de turma própria.
- Frequência aparece em gerenciamento.
- Contratos com PDF são cadastrados e exibidos.
- Salário é calculado com base nas faltas injustificadas.
- Localização só aparece se aluno estiver dentro do perímetro.

### 19.3 Grid

- Professor consegue abrir chamado.
- Gerente consegue atribuir responsável.
- Tarefa aparece no Kanban do responsável.
- Estoque reserva item quando associado a chamado.
- Item pode ser usado ou retornado ao estoque.
- Relatórios exibem dados consolidados.
- Mapa mostra tarefas por bloco/sala.

### 19.4 Segurança

- Usuário sem permissão não acessa rota restrita.
- RLS bloqueia acesso direto indevido.
- Ações sensíveis geram log.
- Segredos não aparecem no app.

---

## 20. Ordem sugerida de implementação

1. Criar projeto Expo com TypeScript.
2. Configurar Expo Router.
3. Configurar Supabase client.
4. Ajustar banco para Supabase Auth.
5. Criar policies RLS iniciais.
6. Criar design system.
7. Criar login, recuperação e hub.
8. Criar layout base Connect e Grid.
9. Implementar SENAI Connect:
   - alunos;
   - professores;
   - turmas/cursos;
   - frequência;
   - localização;
   - contratos;
   - salário.
10. Implementar SENAI Grid:
   - dashboard;
   - chamados;
   - tarefas;
   - estoque;
   - mapa;
   - relatórios;
   - usuários.
11. Implementar Cloudinary uploads.
12. Implementar notificações.
13. Implementar testes manuais e validação de permissões.
14. Preparar build com EAS.

---

## 21. Dados iniciais recomendados

Popular banco com:

- aplicações:
  - SENAI Connect;
  - SENAI Grid.
- blocos:
  - Bloco A — Recepção/Administração;
  - Bloco B — Administrativo;
  - Bloco C — Oficinas;
  - Bloco D — Salas de Aula;
  - Bloco E — Laboratórios.
- salas:
  - Sala 201;
  - Sala 203;
  - Lab. 02;
  - Lab. 04;
  - Oficina 01;
  - Almoxarifado;
  - Portaria.
- categorias de chamados:
  - Elétrico;
  - Hidráulico;
  - Climatização;
  - Infraestrutura;
  - Equipamentos.
- categorias de estoque:
  - Elétrico;
  - Hidráulico;
  - Periféricos;
  - Rede;
  - Equipamentos;
  - Suprimentos.

---

## 22. Observações finais para a IA construtora

- Não recriar o projeto em Laravel; este PRD é para **React + Expo + Supabase + Cloudinary**.
- Não colocar SMTP, Cloudinary API Secret ou Supabase Service Role dentro do app.
- Usar Supabase Auth como fonte principal de autenticação.
- Usar Brevo apenas no backend/Edge Functions quando for necessário e-mail customizado.
- Priorizar primeiro o MVP funcional com Supabase Auth e reset por link/deep link.
- Só implementar recuperação por código se o fluxo visual do produto exigir isso.
- Manter todos os nomes, menus e textos em português brasileiro.
- Seguir as telas mobile geradas como referência visual principal.

