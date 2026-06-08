# Resumo da Auditoria Web

Base URL: http://localhost:8095
Prefixo usado: TESTE-CODEX-20260607191907
Data: 2026-06-07T19:27:10.159Z

## Resultado rapido

- Logins testados: Admin, Aluno e Professor.
- Passos executados: 102.
- Total de eventos capturados: 215.
- A auditoria completa rodou com Node 22 temporario via `npx -p node@22`, porque o Node 24 local causou queda/OOM no Metro.
- Limpeza de dados: nenhuma linha com o prefixo `TESTE-CODEX-20260607191907` ficou nas tabelas testadas.

## Correcoes confirmadas

1. Loop de renderizacao do Aluno corrigido.
   - Novo resultado: `Maximum update depth exceeded` nao apareceu.
   - Rotas Grid/Connect bloqueadas redirecionam o aluno para a area do aluno.

2. Erros de salario do Aluno corrigidos.
   - Novo resultado: nenhum erro em `connect.calculos_salario`.
   - Novo resultado: nenhum erro em `connect.salarios_alunos`.
   - O salario do aluno agora e calculado para exibicao sem gravacao automatica em tabela incompativel.

3. Erros `HEAD/count` do Supabase corrigidos nas metricas principais.
   - Novo resultado: nenhuma requisicao `HEAD` falhou no relatorio completo.
   - Grid, Connect e notificacoes agora contam linhas via `select`.

4. CRUD de estoque validado.
   - Criar, editar e excluir item de estoque passaram no fluxo automatizado.

5. Acessibilidade dos botoes de editar/excluir melhorada.
   - Icones de acao agora possuem `accessibilityLabel`, facilitando clique correto no web e em testes.

## Pendencias atuais

1. Avisos de compatibilidade React Native Web ainda aparecem.
   - `shadow*` deprecated, usar `boxShadow`.
   - `useNativeDriver` nao suportado no web.
   - `Image: style.resizeMode` deprecated, usar `resizeMode` como prop.
   - `props.pointerEvents` deprecated, usar `style.pointerEvents`.

2. CRUD visual ainda precisa refinamento em algumas telas.
   - `/grid/chamados`: o registro de teste foi editado/excluido, mas a verificacao textual de criacao nao encontrou o titulo na tela.
   - `/connect/cursos`: a criacao nao apareceu visualmente no teste.
   - `/connect/empresas`: a criacao nao apareceu visualmente no teste.

3. Ambiente local.
   - Com Node 24, o Metro/Expo continua instavel.
   - A execucao estavel foi feita em `http://localhost:8095` usando Node 22 temporario.

## Arquivos completos

- codex-audit-output/web-audit-report.json
- codex-audit-output/web-audit-report.md
