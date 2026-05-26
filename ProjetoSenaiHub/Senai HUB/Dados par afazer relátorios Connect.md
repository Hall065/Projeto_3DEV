O que já existe
Item	Estado
Rota /connect/relatorio
Só tela “em desenvolvimento”
Menu Relatório na sidebar
Aponta para essa rota
Relatórios Rápidos na Visão Geral
Gráficos (frequência, aulas/semana, alunos por curso) — não é o módulo de relatório
API GET /connect/reports/summary
Resumo básico (contagens por status) — placeholder, sem filtros nem export
Botões Exportar nas listagens
Só visual, sem gerar arquivo
Grid /grid/relatorios
Página mais montada (mock), serve de referência de layout
O que preciso de você (pendências de produto)
Sem isso, dá para montar uma tela bonita, mas não necessariamente o relatório certo:

Quais relatórios entram na 1ª versão?
Exemplos possíveis com os dados atuais:

Alunos (por turma, curso, status)
Frequência (período, turma, % presença/faltas)
Contratos ativos
Salários (referência mensal)
Professores / turmas / cursos
Confirme a lista e a prioridade.
Filtros obrigatórios
Período (data início/fim)? Turma? Curso? Professor? Status?
Quais combinações devem funcionar juntas?

Formato de saída

Só visual na tela
PDF
Excel/CSV
Os três
Modelo visual

Seguir o padrão da Visão Geral + cards SENAI
Ou algo parecido com Grid Relatórios (filtros no topo + KPIs + tabela/gráfico)
Se tiver Figma/PDF de referência, ajuda muito.
Texto institucional
Cabeçalho com logo SENAI, rodapé (“gerado em…”, usuário), nome do relatório — há padrão da instituição?

Regras de negócio

Frequência: qual período padrão (“mês atual”)?
Salário: quem pode ver?
Dados vazios: mensagem padrão?
Escopo Connect vs Grid
Esta tarefa é só Connect (/connect/relatorio) ou também alinhar com Grid?

O que falta no técnico (posso fazer depois das definições acima)
Pendência	Descrição
Frontend ReportPage
Tela real: filtros, preview, tabela/gráficos, export
connectService
Métodos para buscar relatórios (hoje não há getReport…)
API além do summary
Endpoints por tipo (ex.: /reports/attendance, /reports/students) com query params de filtro
Export no backend
Gerar CSV/PDF (ou CSV no front + PDF com lib) — hoje não existe
Ligar botões Exportar das outras páginas
Opcional: reutilizar o mesmo serviço de export
Testes com dados reais
Backend rodando + usuário autenticado + seed com volume razoável
O que já dá para começar sem bloqueio total
Se você quiser avançar já, com defaults razoáveis, posso implementar uma v1 assim:

Layout estilo Grid Relatórios (filtros + KPIs + tabela)
2–3 relatórios: Alunos, Frequência, Contratos
Filtro de período + turma/curso onde fizer sentido
Export CSV (mais rápido) e preview na tela
PDF fica para v2, salvo se você exigir na v1
Resumo em uma frase
Preciso que você defina: quais relatórios, quais filtros, PDF/CSV ou só tela, e o layout de referência. O resto (API, página, export, integração) montamos em cima dos CRUDs e do dashboard que já existem.

Se quiser, responda em tópicos curtos (ex.: “1) Alunos + Frequência + Contratos; 2) período e turma; 3) CSV e tela; 4) igual Visão Geral”) que eu monto o plano de implementação passo a passo ou já começo a v1.