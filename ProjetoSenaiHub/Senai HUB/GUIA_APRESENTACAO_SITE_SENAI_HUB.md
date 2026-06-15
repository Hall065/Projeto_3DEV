# Guia completo para apresentação do site SENAI HUB

> Documento elaborado a partir da estrutura e das regras existentes no projeto web `Senai HUB/`. Use as seções finais como roteiro de fala, revisão rápida e preparação para perguntas.

## Mapa de leitura

| Parte | Conteúdo |
|---|---|
| Seções 1 a 7 | visão geral, tecnologias, arquitetura e organização |
| Seções 8 a 16 | acesso público, autenticação, usuários, permissões e escopos |
| Seções 17 a 31 | funcionalidades acadêmicas do SENAI Connect |
| Seções 32 a 44 | chamados, tarefas, estoque e relatórios do SENAI Grid |
| Seções 45 a 50 | autorizações e fluxos do SENAI Safe |
| Seções 51 a 65 | recursos globais, banco, validações e testes |
| Seções 66 a 68 | limites atuais, pontos fortes e melhorias |
| Seções 69 a 74 | demonstração, fala sugerida, perguntas e checklist |

## 1. Visão geral

O **SENAI HUB** é uma plataforma web integrada que centraliza diferentes áreas da instituição em um único sistema.

O site possui quatro áreas principais:

1. **Hub**: autenticação, seleção de aplicações, usuários, permissões, perfil, configurações, notificações e arquivo.
2. **SENAI Connect**: gestão acadêmica de pessoas, alunos, professores, cursos, turmas, calendário, frequência, contratos e salários.
3. **SENAI Grid**: gestão de manutenção, chamados, tarefas, técnicos, estoque, mapas e relatórios.
4. **SENAI Safe**: controle de solicitações de entrada e saída de alunos, aprovação por professor e confirmação pela portaria.

O sistema também possui:

- landing page pública;
- solicitação pública de acesso;
- recuperação de senha;
- busca global;
- notificações internas e por e-mail;
- personalização visual;
- tradução;
- importação e exportação de planilhas;
- relatórios configuráveis;
- arquivamento de registros finalizados;
- testes automatizados.

### Explicação curta para abrir a apresentação

> O SENAI HUB é uma plataforma web que integra a gestão acadêmica, a manutenção da escola e o controle de entrada e saída de alunos. O usuário faz login uma única vez e o sistema libera apenas os módulos, telas e dados relacionados ao seu perfil. O frontend foi desenvolvido em React e TypeScript, enquanto a API foi desenvolvida em Laravel com autenticação Sanctum.

---

## 2. Problema resolvido

Em uma instituição, diferentes áreas costumam trabalhar com sistemas, planilhas e processos separados.

Isso pode causar:

- duplicação de cadastros;
- dificuldade para localizar informações;
- ausência de controle de acesso;
- conflitos de horários;
- perda de histórico;
- controle manual de frequência;
- dificuldade para acompanhar manutenção;
- falta de rastreabilidade de entradas e saídas;
- relatórios demorados;
- divergência de dados.

O SENAI HUB resolve esses problemas centralizando os processos e conectando as informações.

### Exemplo de integração

No Connect:

```text
Pessoa
  ↓
Aluno
  ↓
Curso e turma
  ↓
Calendário de aulas
  ↓
Frequência
  ↓
Contrato
  ↓
Cálculo salarial
```

No Grid:

```text
Chamado
  ↓
Atribuição de técnico
  ↓
Tarefa
  ↓
Reserva de materiais
  ↓
Execução
  ↓
Aprovação
  ↓
Avaliação
  ↓
Conclusão
```

No Safe:

```text
Solicitação da AQV
  ↓
Aprovação do professor
  ↓
Confirmação da portaria, quando for saída
  ↓
Finalização e histórico
```

---

## 3. Diferença entre o site e o aplicativo mobile

O site da pasta `Senai HUB/` e o aplicativo `Mobile/senai-hub-app/` são produtos separados.

| Site | Aplicativo mobile |
|---|---|
| Backend Laravel | Backend Supabase |
| Autenticação Laravel Sanctum | Supabase Auth |
| Banco controlado pelas migrations Laravel | Banco estruturado nos schemas Supabase |
| Frontend React para navegador | React Native e Expo |
| API REST própria | API do Supabase e Edge Functions |

Os dois projetos compartilham o conceito de Hub, Connect e Grid, mas não utilizam automaticamente o mesmo backend.

### Resposta importante

> O site não é apenas a versão web do aplicativo Expo. Ele possui sua própria API Laravel, banco, regras e autenticação. Uma integração completa entre os dois exigiria uma estratégia para unificar identidade, dados e contratos de API.

---

## 4. Tecnologias utilizadas

### Frontend

| Tecnologia | Função |
|---|---|
| React 19 | Construção da interface |
| TypeScript | Tipagem e segurança do código |
| Vite | Servidor de desenvolvimento e build |
| React Router | Navegação da SPA |
| Axios | Comunicação com a API |
| Tailwind CSS | Estilização |
| i18next | Tradução da interface |
| Lucide React | Ícones |
| DnD Kit | Arrastar e soltar nos quadros Kanban |
| Three.js | Renderização do mapa 3D |

### Backend

| Tecnologia | Função |
|---|---|
| PHP 8.3+ | Linguagem do backend |
| Laravel 13 | API, validação, models e regras |
| Laravel Sanctum | Tokens de autenticação |
| Eloquent ORM | Consultas e relacionamentos |
| Migrations | Versionamento do banco |
| Seeders | Dados iniciais e demonstração |
| Mail | Recuperação de senha e notificações |
| PHPUnit | Testes do backend |

### Testes

| Tecnologia | Função |
|---|---|
| PHPUnit | Testes unitários e de API |
| Playwright | Testes completos no navegador |

---

## 5. Arquitetura geral

O sistema segue uma arquitetura cliente-servidor:

```text
Navegador
   ↓
React + TypeScript
   ↓ requisição HTTP com token
Axios
   ↓
API REST Laravel
   ↓
Middleware de autenticação e permissão
   ↓
Controller
   ↓
Service
   ↓
Model Eloquent
   ↓
Banco de dados
```

### Responsabilidades

- **Página React**: apresenta dados e recebe ações.
- **Componente**: parte reutilizável da interface.
- **Context**: estado compartilhado, como sessão e notificações.
- **Service frontend**: chama endpoints da API.
- **Route Laravel**: define o endpoint e os middlewares.
- **Controller**: valida a requisição e coordena a resposta.
- **Service backend**: executa regras de negócio complexas.
- **Model**: representa uma tabela e seus relacionamentos.
- **Resource**: padroniza o JSON devolvido.
- **Middleware**: bloqueia acesso não autorizado.

### Exemplo: abrir um chamado

```text
GridTicketsPage
   ↓
gridService
   ↓ POST /api/grid/tickets
auth:sanctum
permission:grid.tickets.manage
   ↓
TicketController::store
   ↓
GridWorkflowService
   ↓
GridTicket
   ↓
Banco de dados
   ↓
Notificação
   ↓
JSON para o frontend
```

---

## 6. Organização do projeto

```text
Senai HUB/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Middleware/
│   │   ├── Http/Requests/
│   │   ├── Http/Resources/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Support/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── resources/views/
│   ├── routes/api.php
│   └── tests/
├── frontend/
│   ├── e2e/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── config/
│       ├── contexts/
│       ├── hooks/
│       ├── i18n/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
├── ACESSOS_PADRAO.md
├── README.md
└── SUGESTOES_MELHORIAS.md
```

---

## 7. Funcionamento da SPA

SPA significa **Single Page Application**.

O navegador carrega a aplicação React e as mudanças de tela acontecem com React Router, sem recarregar todo o documento HTML.

O arquivo principal de rotas é:

```text
frontend/src/routes/index.tsx
```

### Tipos de rota

- rotas públicas;
- rotas de autenticação;
- rotas protegidas;
- rotas exclusivas de administrador;
- rotas protegidas por módulo;
- rotas protegidas por permissão;
- rota de acesso negado;
- rota 404.

### Lazy loading

Telas mais pesadas, como mapas e planilhas, são carregadas somente quando o usuário acessa a rota.

Isso reduz o tamanho do carregamento inicial.

---

## 8. Landing page pública

A rota `/` apresenta a página institucional.

Ela é composta por:

- cabeçalho;
- seção principal;
- apresentação da plataforma;
- prévia dos temas;
- públicos atendidos;
- funcionalidades;
- chamada para ação;
- rodapé.

A landing page explica a proposta do sistema antes do login e direciona o usuário para autenticação ou solicitação de acesso.

---

## 9. Solicitação pública de acesso

Usuários sem conta podem acessar:

```text
/solicitar-acesso
```

O formulário recebe:

- nome;
- e-mail;
- organização;
- mensagem.

### Fluxo

1. O frontend envia `POST /api/access-requests`.
2. O backend valida os dados.
3. Cria um registro com status `pending`.
4. Dispara uma notificação aos administradores.
5. O administrador analisa o pedido em `/hub/usuarios`.

O endpoint possui limite de cinco solicitações por minuto para reduzir abuso.

### Usuário sem perfil

Um usuário pode existir com o perfil `unassigned`.

Nesse caso:

- ele consegue entrar;
- não recebe acesso aos módulos;
- vê um painel informando que aguarda liberação;
- pode solicitar a configuração de acesso.

---

## 10. Autenticação

### Login

O fluxo começa em `/login`.

1. O usuário informa e-mail e senha.
2. O frontend chama `POST /api/auth/login`.
3. O Laravel procura o usuário pelo e-mail.
4. `Hash::check` compara a senha.
5. O Sanctum cria um token pessoal.
6. A API retorna usuário e token.
7. O frontend salva os dados no `localStorage`.
8. O Axios envia o token nas próximas requisições.

### Cabeçalho enviado

```http
Authorization: Bearer TOKEN
```

### Persistência da sessão

O frontend armazena:

```text
senai_hub_token
senai_hub_user
```

Ao abrir o site:

1. verifica se existe token;
2. chama `GET /api/auth/me`;
3. atualiza o usuário;
4. remove a sessão se o token for inválido.

O usuário também é atualizado quando a janela volta a receber foco.

### Sessão expirada

O interceptor do Axios detecta HTTP 401:

- remove token e usuário;
- redireciona para `/login?expired=1`;
- evita redirecionamento repetido nas páginas de autenticação.

### Logout

O logout:

1. exclui o token atual no backend;
2. limpa o estado local;
3. redireciona para login.

---

## 11. Recuperação e alteração de senha

### Recuperar senha

1. O usuário informa o e-mail.
2. O Laravel cria um token pelo Password Broker.
3. É gerado um link para `/redefinir-senha`.
4. O e-mail é enviado pela classe `HubResetPasswordMail`.

Por segurança, a resposta não revela se o e-mail existe.

### Redefinir senha

O link contém:

- e-mail;
- token temporário.

O backend valida o token e atualiza a senha. Depois da redefinição, todos os tokens anteriores do usuário são apagados.

### Alteração no perfil

O usuário autenticado também pode mudar a senha informando:

- senha atual;
- nova senha;
- confirmação.

O backend valida a senha atual com `Hash::check`.

---

## 12. Perfil do usuário

A tela `/perfil` permite:

- visualizar nome e e-mail;
- visualizar perfil e permissões;
- visualizar aplicações liberadas;
- visualizar empresa relacionada;
- alterar nome;
- alterar e-mail;
- alterar senha;
- enviar foto;
- remover foto;
- acessar configurações;
- sair da conta.

### Avatar

O arquivo é enviado como `FormData`.

O backend:

1. remove o avatar anterior armazenado;
2. salva o novo arquivo no disco público;
3. grava a URL em `avatar_url`;
4. retorna o usuário atualizado.

Arquivos externos não são apagados por engano; o serviço só remove caminhos reconhecidos como pertencentes ao armazenamento público.

---

## 13. Hub de aplicações

A rota `/hub` é a entrada dos usuários autenticados.

Ela:

- carrega as aplicações permitidas;
- mostra cards do Connect, Grid e Safe;
- esconde módulos sem permissão;
- apresenta o painel de acesso pendente;
- oferece navegação para perfil, configurações e arquivo.

As aplicações não são decididas apenas no frontend. O backend calcula os módulos liberados com base no perfil e nas permissões.

---

## 14. Administração de usuários

A rota `/hub/usuarios` é protegida pelo `AdminRoute` e pelo middleware `admin` no backend.

### Funções

- listar usuários;
- pesquisar;
- filtrar por perfil;
- visualizar detalhes;
- criar;
- editar;
- alterar senha;
- alterar perfil;
- personalizar permissões;
- vincular empresa;
- excluir;
- consultar pedidos de acesso.

### Perfis

O site reconhece:

- `admin`;
- `unassigned`;
- `connect_professor`;
- `connect_secretaria`;
- `connect_diretor`;
- `connect_aqv`;
- `connect_empresa`;
- `connect_aluno`;
- `grid_chefe`;
- `grid_funcionario`;
- `grid_professor`;
- `grid_secretaria`;
- `safe_aqv`;
- `safe_professor`;
- `safe_portaria`.

### Permissões padrão e personalizadas

Cada perfil possui um pacote padrão de permissões.

O administrador pode personalizar as permissões de um usuário. Quando existe `custom_permissions`, essa lista substitui o pacote padrão.

### Regras automáticas

- permissão de gerenciar aluno também inclui visualização;
- gerenciar professor também inclui visualização;
- gerenciar turma também inclui visualização;
- gerenciar curso também inclui visualização;
- gerenciar frequência também inclui visualização;
- gerenciar estoque também inclui visualização;
- cada perfil recebe a permissão base do seu módulo.

### Empresa parceira

O perfil `connect_empresa` exige `company_name`. Esse valor é usado para limitar alunos e contratos à empresa correspondente.

### Segurança

O administrador não pode excluir a própria conta.

Ao alterar o perfil:

- as aplicações são sincronizadas;
- as permissões são recalculadas;
- uma notificação pode ser gerada.

---

## 15. Sistema de permissões

O arquivo central é:

```text
backend/config/permissions.php
```

Ele define:

- perfis;
- descrições;
- módulo principal;
- permissões padrão;
- itens de navegação;
- aplicações de cada perfil.

### Sincronização frontend

O comando:

```bash
php artisan hub:sync-permissions-frontend
```

gera:

```text
frontend/src/generated/permissionKeys.ts
frontend/src/generated/navManifest.ts
```

Isso reduz divergência entre menus do React e regras do Laravel.

### Camadas de proteção

1. `ProtectedRoute`: exige autenticação.
2. `ModuleAccessRoute`: exige acesso ao módulo.
3. `PermissionRoute`: exige permissão para a rota.
4. Menu: esconde itens não permitidos.
5. Middleware `auth:sanctum`: valida o token.
6. Middleware `permission`: valida a ação.
7. `UserAccessScope`: limita quais registros o usuário recebe.

### Por que esconder o menu não basta?

Porque alguém poderia tentar chamar a URL ou API manualmente. O backend precisa negar a requisição mesmo quando a interface foi contornada.

---

## 16. Escopo de dados por perfil

O `UserAccessScope` aplica filtros diretamente nas consultas.

### Connect

#### Aluno

Recebe apenas:

- seu próprio cadastro;
- sua turma;
- seu curso;
- seus professores;
- sua frequência;
- seus contratos;
- seu salário.

#### Empresa

Recebe alunos e contratos cuja empresa coincide com `company_name`.

#### Professor

Recebe turmas ligadas ao próprio cadastro de professor e os alunos dessas turmas.

### Grid

#### Funcionário

Recebe:

- chamados atribuídos a ele;
- tarefas atribuídas a ele.

#### Professor e secretaria

Recebem chamados e tarefas abertos por eles próprios.

#### Chefe e administrador

Possuem visão ampla da operação.

### Resultado

O mesmo endpoint pode devolver conjuntos diferentes de registros conforme o usuário autenticado.

---

## 17. SENAI Connect

O Connect administra a área acadêmica.

---

## 18. Dashboard Connect

A rota `/connect` apresenta indicadores calculados no backend:

- total de alunos;
- professores;
- cursos;
- turmas;
- taxa de presença;
- atividades recentes;
- alertas;
- distribuição da frequência;
- tendências semanais;
- evolução dos indicadores.

As consultas passam pelo escopo do usuário. Portanto, um professor ou empresa não recebe necessariamente os mesmos totais de um administrador.

---

## 19. Pessoas

A rota `/connect/pessoas` gerencia a entidade central `HubPerson`.

Uma pessoa pode representar:

- aluno;
- professor;
- funcionário;
- outro contato institucional.

### Funções

- listar;
- pesquisar;
- cadastrar;
- editar;
- excluir;
- consultar perfil detalhado;
- associar cursos e turmas.

### Por que existe uma tabela central de pessoas?

Para evitar duplicação de dados pessoais. Aluno e professor podem manter dados específicos em suas tabelas, mas compartilham uma identidade central.

---

## 20. Alunos

A rota `/connect/alunos` permite:

- listar alunos;
- busca por nome, matrícula, e-mail e CPF;
- filtros;
- paginação;
- cadastro;
- edição;
- exclusão;
- perfil detalhado;
- vínculo com turma;
- vínculo com curso;
- armazenamento de metadados adicionais.

### Cadastro

O controller usa uma transação:

1. cria ou atualiza a pessoa central;
2. cria o registro acadêmico;
3. vincula turma;
4. sincroniza relações de matrícula;
5. dispara notificações.

Se uma etapa falhar, a transação desfaz todas as alterações.

### Busca por nome

A busca considera o perfil central da pessoa e divide termos do nome. Isso permite localizar nomes compostos mesmo quando as partes estão distribuídas ou digitadas parcialmente.

### Filtros

Os filtros visuais são aplicados à API. A página separa o estado em edição dos filtros realmente aplicados e reinicia a paginação quando o conjunto muda.

---

## 21. Professores

A rota `/connect/professores` permite:

- listar;
- pesquisar;
- filtrar por status e especialidade;
- cadastrar;
- editar;
- excluir;
- visualizar perfil;
- associar cursos e turmas.

O cadastro também usa transação para manter a pessoa central e o registro docente sincronizados.

---

## 22. Cursos

A rota `/connect/cursos` administra:

- código;
- nome;
- descrição;
- modalidade;
- período;
- carga horária;
- datas;
- status;
- pessoas vinculadas;
- turmas.

### Exclusão

O backend verifica vínculos relevantes antes de remover. Isso evita apagar um curso e deixar turmas ou matrículas inconsistentes.

### Roster do curso

O roster é a lista de pessoas relacionadas ao curso, com papéis como aluno ou professor.

---

## 23. Turmas

A rota `/connect/turmas` administra:

- código;
- nome;
- curso;
- professor;
- semestre;
- turno;
- datas;
- quantidade padrão de aulas;
- alunos;
- horários semanais;
- status.

### Validações

O backend verifica:

- data final posterior à inicial;
- turma dentro do período do curso;
- ausência de turma ativa duplicada no mesmo semestre;
- ausência de sobreposição de períodos incompatíveis.

### Roster da turma

Permite adicionar ou remover alunos da turma.

O `ConnectEnrollmentService` sincroniza os relacionamentos para manter os cadastros consistentes.

---

## 24. Calendário acadêmico

A rota `/connect/calendario` gerencia aulas.

### Funcionalidades

- visualizar calendário;
- filtrar por turma e período;
- criar aula manual;
- editar;
- cancelar ou excluir;
- cadastrar padrão semanal;
- gerar calendário automaticamente;
- consultar semestres;
- preparar sessões de frequência.

### Padrão semanal

Exemplo:

```text
Segunda-feira
08:00 às 12:00
4 aulas
Disciplina: Desenvolvimento de Sistemas
```

Uma turma pode ter vários padrões.

### Geração automática

O `ConnectScheduleService`:

1. valida datas da turma;
2. valida o período do curso;
3. percorre cada dia do período;
4. encontra os padrões compatíveis;
5. respeita a carga horária;
6. impede aula duplicada;
7. impede conflito da turma;
8. impede conflito do professor;
9. cria as aulas;
10. prepara sessões de frequência.

### Regra de conflito

Existe conflito quando:

```text
início existente < fim novo
e
fim existente > início novo
```

Essa condição detecta horários sobrepostos.

### Substituir aulas futuras

O sistema pode apagar aulas futuras ainda não realizadas e sem frequência para gerar novamente a partir dos padrões.

---

## 25. Frequência

A rota `/connect/frequencia` é usada para registrar a chamada.

### Fluxo

1. selecionar turma;
2. selecionar data ou aula;
3. localizar ou criar sessão;
4. carregar os alunos;
5. marcar presença;
6. marcar atraso;
7. marcar falta justificada;
8. marcar falta;
9. informar aulas perdidas;
10. salvar e fechar a sessão.

### Sessão de frequência

Uma sessão pertence a:

- turma;
- professor;
- aula agendada;
- data;
- disciplina;
- quantidade de aulas.

### Marcas automáticas

Ao criar a sessão, o serviço cria uma marca inicial para cada aluno da turma.

O status inicial é:

```text
present
```

O professor altera apenas as exceções.

### Estados

- `present`: presente;
- `late`: atraso, considerado presença nas métricas;
- `justified`: falta justificada;
- `absent`: falta injustificada.

---

## 26. Gerenciamento de frequência

A rota `/connect/gerenciar-frequencia` oferece uma visão analítica:

- registros;
- filtros;
- resumo por turma;
- resumo por aluno;
- sessões abertas;
- sessões fechadas;
- aulas sem chamada;
- taxa de presença;
- faltas justificadas;
- faltas injustificadas.

### Taxa de presença

```text
taxa = presenças / total de marcações × 100
```

Presença e atraso entram como presença.

---

## 27. Contratos

A rota `/connect/contratos/alunos` administra:

- aluno;
- tipo do contrato;
- empresa;
- valor mensal;
- início;
- término;
- status;
- dados complementares.

### Escopo

- aluno vê os próprios contratos;
- empresa vê contratos da própria empresa;
- perfis administrativos veem o conjunto permitido.

### Validação

O contrato é vinculado a um aluno existente e pode ser usado pelo cálculo salarial.

---

## 28. Salários e bolsas

A rota `/connect/salario` permite:

- consultar cálculos;
- pesquisar aluno;
- filtrar mês e status;
- visualizar totais;
- gerar prévia;
- visualizar frequência;
- visualizar contrato;
- visualizar composição;
- realizar cálculo individual;
- realizar cálculo em lote, para administrador.

### Fórmula

O backend procura o contrato ativo no mês.

```text
salário-base = valor mensal do contrato
```

Se não houver valor:

```text
salário-base padrão = R$ 1.518,00
```

O cálculo utiliza 22 dias:

```text
valor diário = salário-base / 22
desconto por ausência = valor diário × faltas injustificadas
valor líquido = salário-base + bonificações - descontos
```

### Frequência usada

No mês selecionado:

- `present` e `late` contam como presença;
- `justified` conta separadamente;
- `absent` gera a quantidade de faltas injustificadas.

### Prévia e salvamento

- prévia: calcula sem gravar;
- cálculo: cria ou atualiza o fechamento;
- lote: repete para todos os alunos permitidos.

O `updateOrCreate` impede duplicar o registro do mesmo aluno no mesmo mês.

---

## 29. Localização e mapa Connect

A rota `/connect/localizacao` apresenta pessoas no campus.

### Funções

- listar alunos e profissionais;
- filtrar;
- selecionar pessoa;
- selecionar bloco;
- mostrar detalhes;
- visualizar posições;
- mapa 2D;
- mapa 3D.

### Mapa 3D

O frontend carrega modelos GLB dos blocos:

- A;
- B;
- C;
- D.

O Three.js permite:

- girar;
- aproximar;
- selecionar;
- destacar bloco;
- exibir marcadores;
- alterar transparência para visualizar pontos internos.

### Dados simulados

O serviço pode incluir pessoas de demonstração. Portanto, durante a apresentação, é importante distinguir marcadores reais dos extras de demonstração.

---

## 30. Relatórios Connect

O Connect possui:

- resumo acadêmico;
- indicadores;
- exportação rápida;
- construtor personalizado.

### Seções disponíveis

- capa;
- resumo executivo;
- KPIs;
- frequência;
- alunos por curso;
- alunos;
- professores;
- turmas;
- contratos;
- sessões de frequência;
- detalhes de frequência;
- ranking de turmas.

### Filtros

- período;
- curso;
- turma;
- status do aluno.

### Colunas configuráveis

Nas tabelas, o usuário escolhe quais colunas serão exibidas.

### Presets

Exemplos:

- completo acadêmico;
- foco em frequência;
- matrículas e turmas.

### Formatos

- CSV;
- XLSX;
- JSON;
- HTML;
- impressão do HTML como PDF pelo navegador.

---

## 31. Planilhas Connect

A rota `/connect/planilhas` permite importar e exportar:

- pessoas;
- alunos;
- professores;
- cursos;
- turmas;
- contratos;
- frequência;
- sessões.

### Fluxo de importação

1. baixar modelo;
2. preencher arquivo;
3. selecionar arquivo;
4. gerar prévia;
5. analisar erros;
6. confirmar importação;
7. consultar log.

### Prévia sem gravar

A prévia executa a importação dentro de uma transação e força rollback.

Isso permite calcular:

- quantos seriam criados;
- quantos seriam atualizados;
- quais linhas possuem erro;
- amostra dos dados.

Nenhuma alteração é mantida durante a prévia.

### Importação real

A importação:

- cria e atualiza registros;
- usa transações por operação;
- registra totais;
- registra erros;
- salva um log;
- gera notificação.

---

## 32. SENAI Grid

O Grid gerencia a manutenção e os recursos físicos.

---

## 33. Dashboard Grid

A rota `/grid` apresenta:

- chamados abertos;
- chamados em atendimento;
- chamados concluídos;
- itens com estoque baixo;
- distribuição por status;
- tarefas por coluna;
- chamados por mês;
- chamados por técnico;
- evolução semanal;
- itens críticos.

As métricas respeitam o escopo do perfil.

---

## 34. Chamados

A rota `/grid/chamados` possui:

- visualização em lista;
- visualização Kanban;
- pesquisa;
- filtros;
- criação;
- edição;
- atribuição;
- anexos;
- criação de tarefa;
- aprovação;
- avaliação;
- relatório individual;
- exclusão.

### Campos

- código;
- solicitante;
- título;
- resumo;
- sala;
- bloco;
- prioridade;
- status;
- técnico;
- datas;
- solução;
- considerações.

### Código automático

O `GridCode` gera códigos sequenciais para chamados e tarefas.

### Perfis solicitantes

Professor e secretaria do Grid têm o solicitante forçado para o próprio usuário. Isso evita abrir chamado em nome de outra pessoa.

---

## 35. Fluxo completo do chamado

```text
Aberto
  ↓ atribuir técnico
Pendente
  ↓ iniciar atendimento
Em atendimento
  ↓ concluir tarefa
Aguardando aprovação
  ↓ chefe aprova
Avaliação pendente
  ↓ solicitante avalia
Concluído
```

### 1. Aberto

Chamado ainda sem técnico.

### 2. Pendente

Possui técnico, mas ainda não começou.

### 3. Em atendimento

O serviço começou e existe uma tarefa operacional.

O chamado fica bloqueado para movimento manual.

### 4. Aguardando aprovação

Todas as tarefas foram concluídas. O chefe analisa o serviço.

### 5. Avaliação pendente

O chefe aprovou. O solicitante deve dar nota de 1 a 5 e pode escrever observações.

### 6. Concluído

O solicitante avaliou e o fluxo terminou.

### Regras importantes

- não inicia sem técnico;
- não move manualmente quando está em atendimento;
- não vai direto para aprovação;
- não conclui sem avaliação;
- estados finais são alcançados por ações específicas;
- frontend e backend validam as transições.

---

## 36. Controle de chamados

A rota `/grid/controle` oferece uma visão específica do processo operacional.

Ela reúne:

- etapas;
- chamados;
- filtros;
- criação;
- indicadores;
- ações de transição;
- acompanhamento visual.

O objetivo é permitir que a equipe gerencie a fila sem depender apenas da listagem comum.

---

## 37. Tarefas

A rota `/grid/tarefas` utiliza Kanban.

### Colunas

- `a_fazer`;
- `em_andamento`;
- `concluidas`.

### Funções

- criar tarefa;
- editar;
- excluir;
- vincular chamado;
- atribuir técnico;
- escolher materiais;
- mover por arrastar e soltar;
- registrar solução;
- sincronizar chamado.

### Movimento

Ao mover a tarefa:

1. o backend recebe a nova coluna;
2. atualiza o rótulo;
3. registra conclusão quando necessário;
4. atualiza reservas de estoque;
5. atualiza o chamado relacionado.

### Sincronização com chamado

Quando a última tarefa é concluída e o chamado está em atendimento:

```text
chamado.status = aguardando_aprovacao
```

---

## 38. Estoque

A rota `/grid/estoque` gerencia:

- título;
- descrição;
- categoria;
- SKU;
- quantidade disponível;
- quantidade mínima;
- local;
- fornecedor;
- custo;
- data de compra;
- imagem;
- status.

### Entrada e saída

O ajuste de estoque aceita:

- `in`: entrada;
- `out`: saída.

Depois do ajuste, o status é recalculado e o sistema pode notificar estoque baixo.

### Duplicatas

Antes de criar, o backend procura item com:

- mesmo SKU;
- ou título normalizado equivalente.

Se encontrar:

- não cria uma nova linha;
- soma a quantidade;
- preenche dados ausentes;
- informa que houve mesclagem.

### Imagens

O item pode:

- receber upload local;
- receber URL;
- buscar imagem no Wikimedia Commons;
- usar fallback pela categoria.

### Status

- disponível;
- baixo;
- reservado.

---

## 39. Reserva e consumo de materiais

Materiais podem ser ligados a uma tarefa.

### Validação inicial

O backend verifica:

- item existente;
- estoque maior que zero;
- quantidade solicitada;
- soma de linhas repetidas;
- disponibilidade real.

### Ao entrar em andamento

```text
disponível -= quantidade
reservado += quantidade
reserva.status = reserved
```

### Ao sair de andamento

Se a tarefa volta ou é cancelada:

```text
disponível += quantidade
reservado -= quantidade
reserva.status = released
```

### Ao concluir

```text
reservado -= quantidade
reserva.status = consumed
```

A quantidade já havia sido retirada do disponível no momento da reserva.

### Concorrência

O backend usa:

```php
lockForUpdate()
```

Isso reduz o risco de duas tarefas reservarem simultaneamente a mesma quantidade.

---

## 40. Anexos de chamado

O usuário pode enviar arquivos para um chamado.

O backend:

- valida o arquivo;
- armazena no disco configurado;
- cria o registro de anexo;
- registra quem enviou;
- devolve a URL pública.

Na exclusão do chamado:

- reservas são liberadas;
- anexos físicos são apagados;
- tarefas relacionadas são removidas.

---

## 41. Usuários Grid

A rota `/grid/usuarios` administra membros da equipe de manutenção.

Permite:

- listar;
- pesquisar;
- cadastrar;
- editar;
- excluir;
- visualizar detalhes;
- definir papel e disponibilidade.

Esses registros representam participantes operacionais do Grid e podem ser sincronizados com usuários centrais.

---

## 42. Mapa Grid

A rota `/grid/mapa` apresenta chamados e tarefas no campus.

### Funções

- mapa 3D;
- mapa 2D;
- seleção de bloco;
- marcadores;
- filtros por status;
- filtros por tipo;
- detalhes do atendimento;
- destaque visual.

Somente registros ainda ativos são usados no mapa:

- aberto;
- pendente;
- em atendimento;
- aguardando aprovação;
- avaliação pendente.

---

## 43. Relatórios Grid

O construtor do Grid possui:

- capa;
- resumo executivo;
- KPIs;
- chamados por status;
- chamados por mês;
- chamados por técnico;
- tabela de chamados;
- tabela de tarefas;
- tabela de estoque;
- estoque crítico.

### Filtros

- período;
- status;
- prioridade;
- bloco.

### Presets

- operação completa;
- indicadores de manutenção;
- estoque e materiais.

### Relatório individual do chamado

O relatório de um chamado reúne:

- dados do chamado;
- linha do tempo;
- duração;
- tarefas;
- materiais;
- localização;
- aprovação;
- avaliação.

---

## 44. Planilhas Grid

A rota `/grid/planilhas` permite trabalhar com:

- usuários;
- estoque;
- chamados;
- tarefas.

Possui o mesmo fluxo de:

- modelo;
- exportação;
- prévia;
- importação;
- log.

---

## 45. SENAI Safe

O Safe controla autorizações escolares de entrada e saída.

### Perfis

- AQV;
- professor;
- portaria.

Cada perfil possui uma responsabilidade diferente.

---

## 46. Alunos Safe

A rota `/safe/alunos` permite:

- cadastrar alunos;
- editar;
- excluir;
- buscar;
- informar turma;
- informar responsável;
- informar contatos;
- manter dados usados nas solicitações.

Esse cadastro é específico do fluxo de controle de acesso.

---

## 47. Autorizações Safe

A rota `/safe/autorizacoes` é usada principalmente pela AQV.

### Tipos

- entrada;
- saída.

### Dados

- protocolo;
- aluno;
- turma;
- tipo;
- motivo;
- quantidade de ausências;
- data e hora;
- observações;
- solicitante;
- status.

### Protocolo

Formato:

```text
SAF2026-00001
```

O sistema procura o último protocolo do ano e incrementa a sequência.

### Histórico

Cada ação cria um log com:

- autorização;
- ação;
- usuário;
- data e hora.

---

## 48. Fluxo de entrada Safe

```text
AQV cria solicitação
  ↓
Aguardando professor
  ↓
Professor aprova
  ↓
Finalizado
```

Se o professor negar:

```text
Negado
```

A entrada não precisa de confirmação posterior da portaria na lógica atual.

---

## 49. Fluxo de saída Safe

```text
AQV cria solicitação
  ↓
Aguardando professor
  ↓
Professor aprova
  ↓
Liberado para portaria
  ↓
Portaria confirma
  ↓
Finalizado
```

O professor ou a portaria podem negar nas suas respectivas etapas.

### Estados

- `pendente_aqv`;
- `aguardando_professor`;
- `liberado_portaria`;
- `finalizado`;
- `negado`.

### Regras

- professor só decide quando está aguardando professor;
- portaria só atua em saída liberada;
- finalizado e negado não podem ser editados;
- todas as mudanças usam transação;
- cada etapa gera histórico e notificações.

---

## 50. Dashboards Safe

O dashboard muda conforme o perfil.

### AQV

- alunos;
- solicitações;
- pendências;
- histórico.

### Professor

- solicitações aguardando decisão;
- aprovações e negativas.

### Portaria

- saídas liberadas;
- confirmações pendentes;
- decisões recentes.

---

## 51. Notificações

O sistema possui notificações internas e e-mail opcional.

### Ações que podem gerar notificações

- solicitação de acesso;
- criação de usuário;
- mudança de perfil;
- alteração de senha;
- matrícula de aluno;
- atribuição de turma;
- aula agendada;
- aula cancelada;
- calendário gerado;
- frequência salva;
- contrato criado;
- chamado criado;
- chamado atualizado;
- tarefa criada;
- tarefa atualizada;
- estoque baixo;
- importação finalizada;
- etapas do Safe.

### Notificações internas

O usuário pode:

- listar;
- consultar quantidade não lida;
- marcar uma como lida;
- marcar todas;
- excluir.

### Atualização

O frontend consulta a contagem a cada 45 segundos.

Portanto, o site usa **polling**, não WebSocket ou Supabase Realtime.

### Preferências

O usuário pode escolher:

- receber no site;
- receber por e-mail;
- quais módulos podem notificar.

### Desenvolvimento

O backend pode redirecionar todos os e-mails para um endereço de teste, evitando envio acidental para usuários reais.

---

## 52. Busca global

A busca abre por:

```text
Ctrl + K
```

ou pelo botão no cabeçalho.

### Pesquisa

- alunos;
- turmas;
- chamados;
- estoque.

### Segurança

Os grupos só aparecem se o usuário possui permissão.

Alunos e turmas usam `UserAccessScope`, respeitando o contexto do perfil.

### Regras

- exige pelo menos dois caracteres;
- limita resultados por grupo;
- gera links com `highlight`;
- permite abrir diretamente o registro.

---

## 53. Arquivo

A rota `/hub/arquivo` reúne registros finalizados.

### Connect

- turmas com status `finished`;
- quantidade de sessões de frequência.

### Grid

- chamados concluídos.

### Safe

- autorizações finalizadas ou negadas.

### Arquivamento automático

O administrador pode executar a rotina que identifica turmas expiradas e altera o status para finalizado.

O sistema não apaga os dados: ele altera o estado e os disponibiliza no arquivo.

---

## 54. Configurações

A rota `/configuracoes` contém:

- atalhos;
- informações da conta;
- aparência;
- idioma;
- redução de movimento;
- notificações;
- limpeza de rascunhos;
- restauração do papel de parede.

### Redução de movimento

É um recurso de acessibilidade que reduz animações.

### Rascunhos locais

Configurações de relatórios podem ser mantidas no navegador e apagadas pela tela.

---

## 55. Temas e aparência

A rota `/temas` permite:

- escolher papel de parede;
- visualizar prévia;
- enviar imagem personalizada;
- remover imagem personalizada;
- restaurar padrão.

### Armazenamento

As preferências são salvas no `localStorage`.

### Tom automático

O sistema analisa o papel de parede e define um tom claro ou escuro para melhorar contraste dos componentes.

---

## 56. Idiomas

O site possui traduções locais em:

- português;
- inglês;
- espanhol.

O idioma é armazenado em:

```text
senai_hub_locale
```

O i18next:

- carrega os arquivos JSON;
- usa português como fallback;
- atualiza o atributo `lang` do HTML;
- permite tradução nos componentes.

---

## 57. Relatórios personalizados

O componente `CustomReportBuilder` é compartilhado pelo Connect e Grid.

### Fluxo

1. busca o schema do módulo;
2. mostra filtros disponíveis;
3. permite escolher seções;
4. permite escolher colunas;
5. permite título e subtítulo;
6. gera a prévia;
7. salva preset;
8. exporta.

### Validação

O backend:

- aceita apenas módulos permitidos;
- aceita apenas seções registradas;
- exige uma seção;
- valida datas;
- adiciona capa automaticamente;
- aplica permissões e escopo.

### Presets

O usuário pode salvar configurações para reutilização.

---

## 58. Planilhas e segurança

O sistema não confia diretamente no arquivo enviado.

Ele:

- valida extensão e conteúdo;
- verifica colunas;
- normaliza dados;
- valida cada linha;
- registra erros;
- usa transações;
- mantém log.

### Vantagem da prévia

O usuário descobre problemas antes de alterar o banco.

---

## 59. Validação e tratamento de erros

### Frontend

- estados de carregamento;
- mensagens;
- toasts;
- confirmação;
- telas vazias;
- formulário controlado;
- erros traduzidos;
- redirecionamento de sessão.

### Backend

- `$request->validate`;
- Form Requests;
- `Rule::in`;
- validação de relacionamentos;
- transações;
- exceptions;
- HTTP 403;
- HTTP 422;
- resources JSON.

### Exemplos

- conflito de horário;
- senha atual incorreta;
- estoque insuficiente;
- perfil sem permissão;
- empresa sem nome;
- chamado sem técnico;
- transição inválida;
- solicitação Safe no estado errado;
- planilha incompatível.

---

## 60. Transações

Uma transação garante que um conjunto de alterações seja tratado como uma unidade.

```text
Tudo funciona → commit
Alguma etapa falha → rollback
```

São usadas em:

- cadastro de alunos;
- cadastro de professores;
- matrículas;
- workflow do Grid;
- reservas;
- importação;
- autorizações Safe.

### Exemplo

Se uma tarefa tentar reservar dois materiais e o segundo estiver sem estoque, a transação impede que o primeiro fique reservado sozinho.

---

## 61. Models e relacionamentos

### Hub

- `User`;
- `Application`;
- `HubPerson`;
- `HubNotification`;
- `AccessRequest`;
- `ReportPreset`;
- `SpreadsheetImportLog`.

### Connect

- `ConnectStudent`;
- `ConnectTeacher`;
- `ConnectCourse`;
- `ConnectClass`;
- `ConnectLessonSchedule`;
- `ConnectAttendanceSession`;
- `ConnectAttendanceMark`;
- `ConnectContract`;
- `ConnectSalaryRecord`;
- `ConnectStudentLocation`.

### Grid

- `GridUser`;
- `GridTicket`;
- `GridTask`;
- `GridInventoryItem`;
- `GridInventoryReservation`;
- `GridTicketAttachment`.

### Safe

- `SafeStudent`;
- `SafeAuthorization`;
- `SafeAuthorizationLog`.

---

## 62. Banco de dados e migrations

As migrations versionam a estrutura do banco.

O projeto possui migrations para:

- usuários;
- tokens Sanctum;
- aplicações;
- pessoas;
- Connect;
- Grid;
- Safe;
- notificações;
- permissões personalizadas;
- relatórios;
- planilhas;
- calendário;
- anexos;
- solicitações de acesso;
- vínculo de funcionários entre módulos.

### Por que migrations?

- recriam o banco;
- documentam mudanças;
- facilitam implantação;
- mantêm equipes sincronizadas;
- permitem testes isolados.

---

## 63. Seeders

Os seeders preparam:

- aplicações;
- permissões;
- usuários de teste;
- dados Connect;
- dados Grid;
- dados Safe;
- chamados de exemplo;
- vínculos entre funcionários.

O comando:

```bash
php artisan migrate --seed
```

cria a estrutura e os dados iniciais.

---

## 64. Health check

O endpoint:

```text
GET /api/health
```

verifica a disponibilidade do backend e serviços essenciais.

O frontend exibe um indicador de saúde no layout.

Isso ajuda a diferenciar erro de interface de indisponibilidade da API.

---

## 65. Testes automatizados

### Backend

Existem testes para:

- autenticação;
- usuários;
- permissões e escopo;
- frequência;
- calendário;
- exclusão de curso;
- Grid;
- anexos;
- estoque;
- Safe;
- notificações;
- planilhas;
- arquivo;
- mapa;
- health check.

### Frontend E2E

O Playwright testa:

- login e Hub;
- fluxo Safe;
- controle Grid;
- movimento Kanban;
- smoke test geral.

### Comandos

```bash
cd backend
php artisan test
```

```bash
cd frontend
npm run test:e2e
```

---

## 66. Recursos que não fazem parte deste site

### Chatbot

O site Laravel/React não possui integração ativa com o chatbot Groq encontrado na pasta `chatbot/`.

Esse material é uma especificação ou projeto separado, a menos que uma integração seja implementada posteriormente.

### Supabase

O site não usa Supabase como backend principal.

### Geofencing em segundo plano

O site possui mapa e localização, mas não executa a tarefa mobile de geofencing do aplicativo Expo.

### Resposta segura

> Esses recursos existem em outros projetos ou especificações do repositório, mas não fazem parte do fluxo atual do site Laravel.

---

## 67. Pontos fortes do projeto

- separação clara entre frontend e backend;
- autenticação por token;
- permissões centralizadas;
- escopo de dados por perfil;
- módulos independentes;
- transações;
- workflow completo de manutenção;
- reserva real de estoque;
- geração de calendário;
- frequência integrada;
- cálculo salarial;
- Safe com histórico;
- importação com prévia;
- relatórios configuráveis;
- notificações;
- internacionalização;
- testes.

---

## 68. Limitações e melhorias futuras

- unificar site e aplicativo mobile;
- integrar chatbot ao site;
- utilizar WebSocket para notificações instantâneas;
- adicionar filas para importações grandes;
- adicionar auditoria geral de alterações;
- reforçar políticas de arquivos;
- expandir testes frontend;
- adicionar paginação virtual em listas grandes;
- substituir dados simulados do mapa por localização real;
- criar documentação OpenAPI;
- centralizar observabilidade e logs;
- implementar recuperação e aprovação de acesso diretamente pelo painel.

---

## 69. Roteiro de demonstração

### 1. Landing page

Explique:

- proposta;
- públicos;
- módulos;
- entrada no sistema.

### 2. Login

Explique:

- API;
- token Sanctum;
- persistência;
- rotas protegidas.

### 3. Hub

Mostre:

- aplicações permitidas;
- notificações;
- busca global;
- perfil;
- configurações.

### 4. Connect

Demonstre:

1. dashboard;
2. aluno;
3. turma;
4. calendário;
5. frequência;
6. contrato;
7. salário;
8. relatório;
9. planilha.

### 5. Grid

Demonstre:

1. chamado;
2. atribuição;
3. tarefa;
4. reserva de estoque;
5. conclusão;
6. aprovação;
7. avaliação;
8. mapa;
9. relatório.

### 6. Safe

Demonstre:

1. cadastro do aluno;
2. solicitação;
3. aprovação;
4. portaria;
5. histórico.

### 7. Administração

Mostre:

- usuários;
- perfis;
- permissões personalizadas;
- escopo.

### 8. Código

Escolha um fluxo e mostre:

```text
Page → Service frontend → Route → Controller → Service → Model
```

---

## 70. Fala sugerida de 10 minutos

### Abertura

> Meu projeto é o SENAI HUB, uma plataforma web que reúne gestão acadêmica, manutenção e controle de entrada e saída em uma única experiência.

### Arquitetura

> O frontend é uma SPA em React e TypeScript. Ele consome uma API REST em Laravel. A autenticação usa Laravel Sanctum, e cada requisição protegida envia um token.

### Segurança

> O sistema protege o menu, a rota do frontend, a rota da API e também o conjunto de registros devolvidos. Por isso, um professor visualiza somente suas turmas, uma empresa visualiza apenas seus aprendizes e um técnico recebe apenas seus chamados e tarefas.

### Connect

> O Connect integra pessoas, cursos, turmas, calendário e frequência. O calendário pode ser gerado por padrões semanais e impede conflitos de turma e professor. A frequência alimenta relatórios e o cálculo de remuneração.

### Grid

> O Grid utiliza um workflow completo. O chamado é atribuído, vira tarefa, reserva materiais, passa por aprovação e termina somente depois da avaliação do solicitante.

### Safe

> O Safe controla entradas e saídas. A AQV cria a solicitação, o professor decide e, nas saídas, a portaria confirma. Todas as etapas geram histórico.

### Recursos gerais

> A plataforma também possui notificações, busca global, relatórios configuráveis, importação com prévia, temas, idiomas e testes automatizados.

### Encerramento

> O principal objetivo foi criar uma plataforma modular e segura, em que cada perfil recebe somente as funções e os dados necessários para o seu trabalho.

---

## 71. Perguntas prováveis e respostas

### O site e o aplicativo mobile usam o mesmo backend?

Não. O site usa Laravel e Sanctum. O mobile usa Supabase. Eles são projetos separados.

### O que é uma SPA?

É uma aplicação em que as mudanças de tela ocorrem no navegador pelo React Router, sem recarregar toda a página.

### Como o frontend conversa com o backend?

Por requisições HTTP usando Axios e endpoints REST.

### Como funciona a autenticação?

O Laravel valida e-mail e senha e cria um token Sanctum. O frontend salva e envia esse token no cabeçalho.

### O token fica onde?

No `localStorage`.

### Existe risco no localStorage?

Sim. Um XSS poderia acessar o token. O projeto precisa manter proteção contra injeção, dependências atualizadas e políticas de conteúdo. Cookies HttpOnly seriam uma alternativa para uma evolução.

### Como o sistema sabe quais módulos mostrar?

O perfil define aplicações e permissões. O backend retorna somente as aplicações permitidas.

### Esconder botão garante segurança?

Não. O backend também valida token, módulo, permissão e escopo.

### O que são permissões personalizadas?

São permissões específicas do usuário que substituem o pacote padrão do perfil.

### Como evita divergência entre menu e backend?

O backend é a fonte principal e existe um comando Artisan que gera o manifesto de navegação do frontend.

### Como um professor vê somente suas turmas?

O backend localiza o cadastro docente pelo usuário e filtra as turmas por esse professor.

### Como uma empresa vê somente seus alunos?

O escopo busca contratos cujo nome da empresa corresponde ao `company_name` do usuário.

### Como o calendário evita conflito?

Ele procura aulas da mesma turma ou professor no mesmo dia cujo intervalo se sobrepõe ao novo.

### Como o calendário é gerado?

O sistema percorre o período da turma, compara os dias com os padrões semanais e cria aulas até atingir a carga horária.

### Como funciona a frequência?

Uma sessão é ligada a turma, data e aula. Cada aluno recebe uma marca, que pode ser presente, atraso, falta justificada ou falta.

### Atraso conta como presença?

Sim, nas métricas atuais.

### Como o salário é calculado?

Valor do contrato dividido por 22 dias. Faltas injustificadas geram desconto diário. Bonificações e outros descontos completam o cálculo.

### O que ocorre se não houver contrato?

O sistema usa o valor padrão de R$ 1.518,00.

### Quem pode salvar cálculo salarial?

Os endpoints de cálculo e lote estão protegidos como administrador. Outros perfis autorizados podem consultar ou gerar a prévia conforme o escopo.

### Como funciona o workflow Grid?

Aberto, pendente, em atendimento, aguardando aprovação, avaliação pendente e concluído.

### Por que o chamado trava em atendimento?

Porque a evolução deve acontecer pela tarefa. Isso mantém o chamado e a execução sincronizados.

### Quando o estoque é descontado?

Ao iniciar a tarefa, a quantidade sai do disponível e entra como reservada. Ao concluir, a reserva é consumida.

### E se a tarefa voltar?

A reserva é liberada e a quantidade retorna ao disponível.

### Como evita duas reservas simultâneas?

Usa transação e `lockForUpdate`.

### Como evita itens duplicados no estoque?

Compara SKU e título normalizado. Quando encontra duplicata, soma a quantidade.

### Como funciona o Safe?

A AQV cria. O professor aprova ou nega. Entrada aprovada finaliza. Saída aprovada vai para a portaria.

### Por que entrada e saída têm fluxos diferentes?

Na regra atual, uma entrada depende apenas da aprovação pedagógica. A saída exige também confirmação física da portaria.

### Existe histórico no Safe?

Sim. Cada ação cria um log com usuário e horário.

### As notificações são em tempo real?

Não exatamente. O frontend faz polling da contagem a cada 45 segundos.

### Como funciona a busca global?

Ctrl+K abre a busca. O backend pesquisa somente grupos permitidos e respeita o escopo do usuário.

### A prévia de planilha grava dados?

Não. Ela executa dentro de transação e faz rollback.

### Quais formatos de relatório existem?

CSV, XLSX, JSON e HTML. O HTML pode ser impresso como PDF.

### O mapa usa modelos reais?

O frontend carrega modelos GLB dos blocos e renderiza com Three.js.

### O mapa mostra localização real?

Pode usar dados cadastrados, mas também pode incluir extras de demonstração. Isso precisa ser explicado na apresentação.

### O site possui chatbot?

Não no código atual do site. A pasta de chatbot é um projeto ou especificação separada.

### Por que usar services no backend?

Para retirar regras complexas dos controllers e permitir reutilização e testes.

### Por que usar transactions?

Para evitar alterações parciais em operações com várias tabelas.

### Por que usar Resources?

Para padronizar o JSON e evitar expor campos internos.

### Como os erros chegam ao usuário?

O Laravel devolve status e mensagens; o frontend interpreta o erro e apresenta toast ou mensagem na tela.

### Como o projeto é testado?

PHPUnit testa backend e regras. Playwright testa fluxos completos no navegador.

---

## 72. Arquivos importantes para mostrar

| Arquivo | Assunto |
|---|---|
| `frontend/src/routes/index.tsx` | Rotas |
| `frontend/src/contexts/AuthContext.tsx` | Sessão |
| `frontend/src/services/api.ts` | Axios e token |
| `backend/routes/api.php` | Endpoints |
| `backend/config/permissions.php` | Perfis e permissões |
| `backend/app/Support/UserAccessScope.php` | Escopo |
| `backend/app/Services/Auth/AuthService.php` | Autenticação |
| `backend/app/Services/Connect/ConnectScheduleService.php` | Calendário |
| `backend/app/Services/Connect/ConnectAttendanceService.php` | Frequência |
| `backend/app/Http/Controllers/Api/Connect/SalaryController.php` | Salário |
| `backend/app/Services/Grid/GridWorkflowService.php` | Workflow Grid |
| `backend/app/Services/Safe/SafeWorkflowService.php` | Workflow Safe |
| `backend/app/Services/Spreadsheet/SpreadsheetService.php` | Planilhas |
| `backend/app/Services/Reports/CustomReportService.php` | Relatórios |
| `backend/app/Services/Search/GlobalSearchService.php` | Busca |
| `backend/app/Services/Notification/NotificationService.php` | Notificações |

---

## 73. Checklist antes da apresentação

- [ ] Executar migrations e seeders.
- [ ] Confirmar backend em execução.
- [ ] Confirmar frontend em execução.
- [ ] Testar login.
- [ ] Preparar conta admin.
- [ ] Preparar conta professor Connect.
- [ ] Preparar conta empresa ou aluno.
- [ ] Preparar chefe e técnico Grid.
- [ ] Preparar AQV, professor e portaria Safe.
- [ ] Criar turma com professor e alunos.
- [ ] Criar padrão semanal.
- [ ] Gerar calendário.
- [ ] Registrar frequência.
- [ ] Preparar contrato.
- [ ] Preparar cálculo salarial.
- [ ] Criar chamado.
- [ ] Preparar técnico.
- [ ] Preparar estoque.
- [ ] Executar fluxo completo do Grid.
- [ ] Preparar solicitação Safe.
- [ ] Testar busca global.
- [ ] Testar notificação.
- [ ] Testar relatório.
- [ ] Testar prévia de planilha.
- [ ] Explicar que mobile e site são separados.
- [ ] Explicar que o chatbot ainda não integra o site.

---

## 74. Resumo para memorização

```text
Frontend:
React + TypeScript + Vite + Axios

Backend:
Laravel + Sanctum + Eloquent

Hub:
identidade, aplicações, usuários, permissões, notificações e arquivo

Connect:
pessoas, alunos, professores, cursos, turmas, calendário,
frequência, contratos, salários, mapas e relatórios

Grid:
chamados, tarefas, técnicos, estoque, reservas,
aprovação, avaliação, mapas e relatórios

Safe:
alunos, entrada, saída, professor, portaria e histórico

Segurança:
token + rota + módulo + permissão + escopo

Qualidade:
validação + transação + Resources + testes
```

### Frase final

> O SENAI HUB foi construído para integrar processos diferentes sem perder a separação de responsabilidades, a segurança por perfil e a rastreabilidade das ações.
