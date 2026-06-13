# Plano Detalhado de Melhorias Frontend - SENAI Hub App

Versao 2.0 | Data: 2026-06-13

Este documento consolida o plano anterior com a analise atual do app `ProjetoSenaiHub/Mobile/senai-hub-app`. O objetivo e transformar os dashboards e fluxos principais em uma experiencia mais profissional, moderna, responsiva e pronta para uso real em mobile e web, sem descaracterizar a identidade ja existente do projeto.

## Contexto Tecnico Atual

O app mobile usa:

| Item | Situacao no projeto |
|---|---|
| Framework | Expo SDK 54 |
| Navegacao | `expo-router` |
| UI base | React Native 0.81 |
| Tema | `useThemeColors`, `colors`, `connectTheme`, `gridTheme` |
| Componentes atuais | `SurfaceCard`, `MetricTile`, `MiniBars`, `RingMetric`, `ProgressBar`, `AppButton`, `AnimatedPressable`, `LoadingState`, `FeedbackMessage` |
| Graficos atuais | Graficos simples via `MiniBars` e metricas visuais via `RingMetric` |
| Animacoes | `Animated` do React Native e `react-native-reanimated` instalado |
| Haptics | `expo-haptics` instalado |
| Exportacao | `expo-print`, `expo-sharing` e `xlsx` instalados |
| SVG | `react-native-svg` ja instalado |
| Dados | Supabase, services separados por modulo |

Principio de implementacao: evoluir a camada visual atual em vez de trocar tudo. O app ja tem uma linguagem visual consistente; a melhoria deve adicionar profundidade analitica, interatividade, padronizacao e acessibilidade.

## Objetivos

1. Substituir graficos simples por graficos interativos, responsivos e exportaveis.
2. Padronizar tokens de design para reduzir inconsistencias entre telas.
3. Melhorar dashboards do Connect, Grid e Aluno com dados mais acionaveis.
4. Criar microinteracoes discretas para deixar o app mais fluido.
5. Respeitar tema claro/escuro, acessibilidade e preferencia de reduzir movimento.
6. Manter performance boa em celulares, tablets e web.

## 1. Graficos Interativos nos Dashboards

### 1.1 Decisao de Biblioteca

Recomendacao principal: `victory-native` com `@shopify/react-native-skia`.

Motivos:

- Boa compatibilidade com React Native.
- Usa Skia, Reanimated e Gesture Handler para graficos de melhor performance.
- E mais adequada para dashboards nativos do que bibliotecas focadas em web.
- Permite evoluir para tooltip, gestos, pan/zoom e customizacao visual.

Dependencias sugeridas:

```bash
cd ProjetoSenaiHub/Mobile/senai-hub-app
npx expo install @shopify/react-native-skia
npm install victory-native
```

Observacao importante: o projeto ja possui `react-native-reanimated`, `react-native-gesture-handler` e `react-native-svg`. Antes de mudar configuracoes do Babel, validar a compatibilidade com a configuracao atual, que usa `react-native-worklets/plugin`.

Alternativa mais simples: `react-native-gifted-charts`.

Use esta alternativa se a prioridade for implementar rapido com menos configuracao. Ela e uma boa escolha para barras, linhas, area, donut, stacked bar e animacoes prontas. A desvantagem e ter menos controle fino do que Victory Native em dashboards mais complexos.

Evitar como primeira escolha:

| Biblioteca | Motivo |
|---|---|
| `Chart.js` | Mais voltado para web, geralmente exige adaptacoes menos naturais no mobile nativo |
| `Recharts` | Excelente em React web, mas nao e ideal para React Native puro |
| Graficos feitos manualmente em Views | Ja existe `MiniBars`, mas manter tudo manual limita tooltip, zoom, acessibilidade e exportacao |

### 1.2 Componentes de Grafico a Criar

Estrutura recomendada:

```text
src/components/charts/
  ChartCard.tsx
  ChartToolbar.tsx
  ChartTooltip.tsx
  ChartLegend.tsx
  ChartEmptyState.tsx
  InteractiveBarChart.tsx
  TrendLineChart.tsx
  DonutStatusChart.tsx
  StackedBarChart.tsx
  ChartExportButton.tsx
  types.ts
  index.ts
```

Responsabilidades:

| Componente | Funcao |
|---|---|
| `ChartCard` | Card padrao com titulo, subtitulo, toolbar, grafico e estado vazio |
| `ChartToolbar` | Filtros de periodo, turma, status e botao de exportacao |
| `ChartTooltip` | Tooltip por toque/long press com valor, data, percentual e contexto |
| `ChartLegend` | Legenda clicavel para ativar/desativar series |
| `InteractiveBarChart` | Barras horizontais/verticais para distribuicoes |
| `TrendLineChart` | Linhas/area para evolucao no tempo |
| `DonutStatusChart` | Proporcoes por status |
| `StackedBarChart` | Comparativos por status, turma, periodo ou prioridade |
| `ChartExportButton` | Captura e exportacao do grafico |

Tipos base:

```ts
export type ChartPeriod = '7d' | '30d' | 'month' | 'semester' | 'year';

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
  meta?: string;
}

export interface TimeSeriesDatum {
  date: string;
  value: number;
  series?: string;
}
```

### 1.3 Dashboards e Graficos por Modulo

#### SENAI Connect

Telas principais:

- `app/connect/index.tsx`
- `app/connect/relatorios.tsx`
- `app/connect/gerenciar-frequencia.tsx`
- `app/connect/salario.tsx`
- `app/connect/cursos.tsx`

| Indicador | Grafico | Valor para o usuario |
|---|---|---|
| Alunos por curso/turma/periodo | Barras horizontais ou stacked bar | Identificar turmas maiores, gargalos e distribuicao academica |
| Frequencia mensal | Linha ou area | Acompanhar tendencia de presenca e queda de frequencia |
| Presentes, faltas justificadas e injustificadas | Donut ou stacked bar | Entender composicao dos registros |
| Contratos ativos, pendentes e encerrados | Donut + lista detalhada | Controle rapido de vinculos empresa/aluno |
| Salario base, desconto e salario final | Barras agrupadas por mes | Explicar impacto da frequencia no calculo |
| Cursos por periodo | Barras horizontais | Evoluir o `MiniBars` atual com tooltip e filtros |

Primeira entrega recomendada no Connect:

1. Trocar `MiniBars` de cursos por periodo por `InteractiveBarChart`.
2. Adicionar `DonutStatusChart` em `app/connect/relatorios.tsx` para frequencias.
3. Adicionar filtro de periodo em `gerenciar-frequencia`.

#### SENAI Grid

Telas principais:

- `app/grid/index.tsx`
- `app/grid/relatorios.tsx`
- `app/grid/chamados.tsx`
- `app/grid/tarefas.tsx`
- `app/grid/estoque.tsx`

| Indicador | Grafico | Valor para o usuario |
|---|---|---|
| Chamados por status | Stacked bar ou barras verticais | Visualizar volume operacional |
| Chamados por prioridade | Barras horizontais | Priorizar urgencias |
| Chamados ao longo do tempo | Linha temporal | Medir aumento/reducao de demanda |
| Estoque critico por categoria | Barras horizontais | Identificar reposicoes urgentes |
| Tarefas por responsavel/status | Stacked bar | Acompanhar distribuicao da equipe |
| Tempo medio de resolucao | Linha | Medir eficiencia operacional |

Primeira entrega recomendada no Grid:

1. Trocar `MiniBars` de prioridades por `InteractiveBarChart`.
2. Criar grafico de chamados por status em `app/grid/relatorios.tsx`.
3. Adicionar tooltip com status, quantidade e percentual.

#### Area do Aluno

Telas principais:

- `app/aluno/dashboard.tsx`
- `app/aluno/frequencia.tsx`
- `app/aluno/grade.tsx`

| Indicador | Grafico | Valor para o usuario |
|---|---|---|
| Frequencia individual | Linha mensal + donut | Mostrar evolucao de presenca |
| Faltas justificadas/injustificadas | Donut ou stacked bar | Explicar situacao academica |
| Salario final e descontos | Barras mensais | Dar transparencia ao calculo |
| Aulas recentes | Timeline compacta | Facilitar acompanhamento do historico |

Primeira entrega recomendada no Aluno:

1. Adicionar `DonutStatusChart` em `app/aluno/dashboard.tsx`.
2. Adicionar linha mensal em `app/aluno/frequencia.tsx`.
3. Manter cards de KPI no topo para leitura rapida.

### 1.4 Interatividade Necessaria

| Recurso | Como deve funcionar |
|---|---|
| Tooltip | Abrir por toque ou long press; nunca depender apenas de hover |
| Filtro de periodo | Opcoes `7 dias`, `30 dias`, `mes`, `semestre`, `ano` |
| Filtro contextual | Turma, curso, status, prioridade ou aluno conforme a tela |
| Legenda clicavel | Permitir ocultar/exibir series em graficos multi-serie |
| Zoom e pan | Usar somente em graficos temporais com muitos pontos |
| Reset visual | Botao para voltar ao zoom/filtro padrao |
| Exportacao | Exportar dados e, quando possivel, imagem do grafico |
| Estado vazio | Mostrar mensagem util e acao recomendada |

### 1.5 Exportacao de Graficos

O projeto ja tem `exportService` com PDF/Excel. Para exportar a imagem do grafico:

```bash
npx expo install react-native-view-shot
```

Fluxo recomendado:

1. Envolver o `ChartCard` exportavel em `ViewShot`.
2. Capturar PNG no botao `Exportar`.
3. Gerar PDF com titulo, filtros aplicados, resumo textual e imagem do grafico.
4. Exportar tabela base para Excel usando `xlsx`.
5. Em mobile, compartilhar com `expo-sharing`.
6. Em web, verificar `Sharing.isAvailableAsync()` e oferecer fallback por download/impressao.

Observacao: no web, compartilhamento de arquivo local tem limitacoes. Tratar web como fluxo separado.

### 1.6 Responsividade dos Graficos

Requisitos:

| Contexto | Comportamento |
|---|---|
| Celular ate 374px | Um grafico por linha, legenda abaixo, labels curtos |
| Celular 375px a 428px | Um grafico por linha, altura entre 220 e 280 |
| Celular grande | Permitir cards mais altos quando houver tooltip/legenda |
| Tablet acima de 768px | Grid com duas colunas para graficos secundarios |
| Web desktop | Cards em duas colunas, graficos principais ocupando largura total |
| Muitas categorias | Preferir barras horizontais ou scroll interno |
| Series temporais longas | Agregar por semana/mes em vez de renderizar muitos pontos |

Implementacao recomendada:

- Criar `useResponsiveChartSize`.
- Usar `useWindowDimensions`.
- Definir altura minima e maxima.
- Evitar fonte baseada diretamente em largura da tela.
- Trocar labels longos por siglas no eixo e texto completo no tooltip.

## 2. Animacoes e UI/UX

### 2.1 Direcao Visual

O SENAI Hub deve parecer uma ferramenta operacional moderna: clara, objetiva, densa na medida certa e confiavel. Evitar telas com cara de landing page, excesso de decoracao, fundos muito chamativos ou animacoes que distraiam.

Diretrizes:

- Cards com raio moderado, preferencialmente `8`.
- Pouca sombra, borda clara e bom contraste.
- Paleta com vermelho SENAI como acento principal do Connect, verde no Grid e azul/tons neutros para informacao.
- Tipografia consistente; titulos de cards menores que titulos de pagina.
- Dados primeiro, decoracao depois.

### 2.2 Tokens de Design

Criar:

```text
src/constants/designTokens.ts
```

Conteudo recomendado:

```ts
import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const fontSize = {
  caption: 10,
  small: 11,
  body: 13,
  bodyLarge: 15,
  title: 18,
  metric: 24,
} as const;

export const chartPalette = [
  colors.red,
  colors.blue,
  colors.green,
  colors.orange,
  colors.purple,
  colors.cyan,
] as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;
```

Depois, migrar gradualmente os valores repetidos de `StyleSheet` para esses tokens.

### 2.3 Componentes de UI a Padronizar

Criar ou evoluir:

| Componente | Motivo |
|---|---|
| `MetricGrid` | Remover repeticao de `metricGrid` em varias telas |
| `DashboardChartCard` | Padronizar titulo, filtros, exportacao, grafico e empty state |
| `SegmentedControl` | Trocar filtros em botao por controle consistente |
| `DateRangeFilter` | Reutilizar selecao de periodo |
| `SkeletonCard` | Melhorar loading dos dashboards |
| `ToastHost` | Feedback global de sucesso/erro |
| `EmptyState` | Estados vazios com acao clara |
| `AnimatedCounter` | Animar KPIs sem exagero |
| `StatusBadge` | Unificar status em Connect/Grid/Aluno |

### 2.4 Animacoes Recomendadas

| Elemento | Animacao | Duracao |
|---|---|---|
| Card de dashboard | `opacity + translateY` | 180ms a 260ms |
| KPI numerico | Contador discreto no primeiro carregamento | 300ms a 500ms |
| Grafico | Entrada de barras/linha apenas no primeiro render | 350ms a 600ms |
| Botao | Scale press atual, entre `0.97` e `1` | imediato |
| Modal | Fade + pequeno slide vertical | 180ms a 240ms |
| Lista apos adicionar item | Fade + translateY curto | 220ms |
| Item removido | Fade out + deslocamento | 180ms |
| Skeleton | Pulse sutil | loop de 900ms a 1200ms |

Evitar:

- Bounce exagerado.
- Confete em acoes rotineiras.
- Animacao continua em cards estaticos.
- Efeitos que rodam enquanto o usuario esta lendo dados.

### 2.5 Microinteracoes

| Acao | Feedback recomendado |
|---|---|
| Trocar filtro de periodo | `Haptics.selectionAsync()` |
| Salvar formulario | Toast de sucesso + `Haptics.notificationAsync(Success)` |
| Erro de validacao | Foco no campo + mensagem + `Haptics.notificationAsync(Error)` |
| Exportar relatorio | Estado `Gerando...`, depois `Relatorio pronto` |
| Concluir tarefa/chamado | Check discreto + mudanca de badge |
| Selecionar ponto do grafico | Tooltip + haptic leve |
| Pull to refresh | Indicador nativo + texto `Atualizado agora` |

Criar helper:

```text
src/utils/feedback.ts
```

Exemplo:

```ts
import * as Haptics from 'expo-haptics';

export async function notifySuccess() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function notifyError() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export async function notifySelection() {
  await Haptics.selectionAsync();
}
```

### 2.6 Acessibilidade e Movimento Reduzido

Usar `useReducedMotion` do `react-native-reanimated` para respeitar a configuracao do sistema.

Criar:

```text
src/hooks/useMotionPreference.ts
```

Exemplo:

```ts
import { useReducedMotion } from 'react-native-reanimated';

export function useMotionPreference() {
  const reduceMotion = useReducedMotion();

  return {
    reduceMotion,
    duration: reduceMotion ? 0 : 220,
    shouldAnimate: !reduceMotion,
  };
}
```

Regras de acessibilidade:

- Area minima de toque: `44x44`.
- Graficos devem ter resumo textual acessivel.
- Nao depender apenas de cor para status.
- Tooltips devem abrir por toque.
- Botao de exportacao deve ter `accessibilityLabel`.
- Estados vazios devem dizer o que esta faltando e qual acao tomar.
- Contraste de texto pequeno deve mirar pelo menos 4.5:1.
- Testar tema claro e escuro nas telas com graficos.

## 3. Arquitetura de Dados para Analytics

Criar:

```text
src/services/analytics.service.ts
```

Objetivo: centralizar agregacoes usadas por dashboards, evitando duplicar filtros e calculos em cada tela.

Funcoes iniciais:

| Funcao | Retorno esperado |
|---|---|
| `getConnectAnalytics(filters)` | Frequencia, alunos por turma, cursos por periodo, contratos |
| `getGridAnalytics(filters)` | Chamados por status/prioridade, estoque critico, tarefas |
| `getAlunoAnalytics(userId, filters)` | Frequencia individual, salario, faltas, aulas |

Boas praticas:

- Quando possivel, buscar dados ja filtrados no Supabase.
- Evitar carregar listas grandes so para contar no frontend.
- Usar `Promise.all` para metricas independentes.
- Memoizar datasets com `useMemo`.
- Padronizar datas com `date-fns`.
- Sempre ter fallback para array vazio.

## 4. Assets Complementares Necessarios

A orientacao principal e usar poucos assets externos. Dashboards profissionais devem parecer operacionais e confiaveis, nao decorativos demais.

### 4.1 Assets Prioritarios

| Asset | Uso | Formato | Tamanho ideal | Diretriz |
|---|---|---|---|---|
| Logo horizontal para relatorios | Cabecalho/capa de PDF | SVG ou PNG transparente | 1024x256, ate 100 KB | Versao SENAI Hub/Connect/Grid limpa |
| Ilustracoes de estado vazio | Listas e relatorios sem dados | SVG ou PNG transparente | 512x512, ate 150 KB | Estilo tecnico, limpo, com cor de acento moderada |
| Padroes de status para graficos | Acessibilidade alem da cor | SVG | 24x24 | Listras, pontos ou hachuras |
| Placeholder de avatar institucional | Usuario sem foto | PNG ou WebP | 256x256, ate 60 KB | Neutro, sem chamar mais atencao que a foto real |
| Miniatura de exportacao | Preview de PDF/Excel | SVG ou PNG | 256x180 | Documento/planilha simples |

### 4.2 Assets Opcionais

| Asset | Quando usar | Cuidado |
|---|---|---|
| Icones customizados de modulo | Se Lucide nao diferenciar bem Hub/Connect/Grid/Aluno | Manter stroke 2px e adaptacao ao tema |
| Ilustracao de onboarding | Apenas se houver fluxo de primeiro acesso | Nao transformar app operacional em landing page |
| Lottie de sucesso | Somente em acoes importantes | Evitar confete em tarefas rotineiras |
| Padrao geometrico sutil | Fundos muito vazios | Opacidade baixa, sem atrapalhar leitura |

### 4.3 Estrutura Recomendada

```text
assets/
  icons/
    custom/
      module-connect.svg
      module-grid.svg
      module-aluno.svg
      status/
        success-pattern.svg
        warning-pattern.svg
        danger-pattern.svg
  illustrations/
    empty-state/
      empty-alunos.svg
      empty-chamados.svg
      empty-relatorios.svg
    feedback/
      success.svg
      error.svg
  reports/
    senai-hub-report-logo.png
  animations/
    lottie/
      success.json
```

## 5. Roadmap de Implementacao

### Fase 1 - Base Visual e Organizacao

Objetivo: criar fundacao para as melhorias sem quebrar telas existentes.

Tarefas:

- Criar `src/constants/designTokens.ts`.
- Criar `MetricGrid`.
- Criar `DashboardChartCard` ainda usando `MiniBars` internamente.
- Criar `useMotionPreference`.
- Criar `SkeletonCard`.
- Auditar `colors.navy`, `colors.white`, `colors.grayText` fixos em telas principais e trocar por `useThemeColors` quando afetar claro/escuro.

Telas alvo:

- `app/connect/index.tsx`
- `app/grid/index.tsx`
- `app/aluno/dashboard.tsx`

Critério de aceite:

- Visual igual ou melhor que o atual.
- Tema claro/escuro sem texto invisivel.
- `npm run lint` sem erros.
- `npx tsc --noEmit` sem erros.

### Fase 2 - Graficos Interativos

Objetivo: substituir os primeiros `MiniBars` por graficos reais.

Tarefas:

- Instalar `@shopify/react-native-skia` e `victory-native`.
- Criar `src/components/charts`.
- Implementar `InteractiveBarChart`, `DonutStatusChart`, `ChartTooltip` e `ChartLegend`.
- Adicionar `ChartCard` com toolbar simples.

Telas alvo:

- `app/connect/index.tsx`
- `app/connect/relatorios.tsx`
- `app/grid/index.tsx`
- `app/grid/relatorios.tsx`

Critério de aceite:

- Graficos aparecem em mobile e web.
- Tooltip funciona por toque.
- Layout nao quebra em 360px, 390px, 428px, tablet e web.
- Sem queda perceptivel de performance no dashboard.

### Fase 3 - Filtros e Analytics Service

Objetivo: deixar os graficos realmente uteis para analise.

Tarefas:

- Criar `analytics.service.ts`.
- Criar `DateRangeFilter`.
- Adicionar filtros por periodo.
- Adicionar filtros contextuais por status/turma/prioridade.
- Agregar dados por dia, semana ou mes conforme periodo.

Critério de aceite:

- Filtro altera cards e graficos juntos.
- Dados vazios mostram `EmptyState`.
- Erro de carregamento mostra `FeedbackMessage`.

### Fase 4 - Exportacao

Objetivo: permitir que dashboards virem relatorios.

Tarefas:

- Instalar `react-native-view-shot`.
- Criar `ChartExportButton`.
- Capturar grafico como PNG.
- Reutilizar `exportService` para PDF/Excel.
- Adicionar logo e resumo dos filtros nos PDFs.

Critério de aceite:

- Exportacao funciona em Android/iOS.
- Web tem fallback apropriado.
- PDF contem titulo, data, filtro aplicado, resumo e grafico.
- Excel contem dados base tabulares.

### Fase 5 - Polimento UX

Objetivo: dar acabamento profissional.

Tarefas:

- Toast global.
- Haptics nos fluxos principais.
- Skeleton nos dashboards.
- AnimatedCounter nos KPIs.
- Transicoes suaves em listas e modais.
- Revisao final de acessibilidade.

Critério de aceite:

- Animacoes respeitam reduzir movimento.
- Interacoes importantes tem feedback claro.
- App continua rapido em celulares medianos.

## 6. Performance

Regras:

- Nao renderizar graficos pesados antes dos dados estarem prontos.
- Usar `useMemo` para datasets.
- Usar `React.memo` em graficos e cards com props estaveis.
- Evitar recalcular filtros dentro do JSX.
- Limitar pontos em series temporais.
- Preferir agregacao no service quando a lista for grande.
- Carregar assets com tamanhos controlados.
- Evitar Lottie grande ou em loop continuo.
- Testar com dados reais e nao apenas poucos registros.

Metas:

| Item | Meta |
|---|---|
| Primeiro carregamento do dashboard | Sem travamento perceptivel |
| Troca de filtro | Ate 300ms em listas medias |
| Grafico temporal | Maximo de pontos adequado ao periodo |
| Asset de empty state | Ate 150 KB |
| Animacoes | Usar native driver/Reanimated quando possivel |

## 7. Checklist de Implementacao

Antes de implementar:

- Confirmar se o app esta instalando dependencias sem conflito.
- Criar branch separada.
- Rodar `npm run lint`.
- Rodar `npx tsc --noEmit`.

Durante:

- Implementar um modulo por vez.
- Trocar `MiniBars` gradualmente.
- Validar claro/escuro a cada tela.
- Testar em largura pequena antes de avançar.

Depois:

```bash
cd ProjetoSenaiHub/Mobile/senai-hub-app
npx tsc --noEmit
npm run lint
npm run web
npm run android
```

Se `npm run android` ou testes em device demorarem demais, validar pelo menos `tsc`, `lint` e `web`, e deixar teste em aparelho para a etapa final.

## 8. Ordem Recomendada de Execucao

1. `designTokens.ts`, `MetricGrid` e `DashboardChartCard`.
2. Graficos reais no Connect.
3. Graficos reais no Grid.
4. Graficos do aluno.
5. Filtros globais e `analytics.service.ts`.
6. Exportacao com imagem do grafico.
7. Skeletons, haptics e toast global.
8. Revisao de acessibilidade e performance.

## 9. Referencias Tecnicas

- Victory Native XL: https://github.com/FormidableLabs/victory-native-xl
- Expo Skia: https://docs.expo.dev/versions/latest/sdk/skia/
- react-native-gifted-charts: https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts
- Expo Haptics: https://docs.expo.dev/versions/latest/sdk/haptics/
- Expo Sharing: https://docs.expo.dev/versions/latest/sdk/sharing/
- Reanimated useReducedMotion: https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/

## 10. Resumo Executivo

O melhor caminho para profissionalizar o frontend do `senai-hub-app` e evoluir o design system existente, adicionar graficos interativos gradualmente e manter o app leve. A prioridade deve ser:

1. Padronizar tokens e componentes.
2. Melhorar dashboards com graficos reais.
3. Adicionar filtros e exportacao.
4. Refinar microinteracoes.
5. Validar acessibilidade, tema claro/escuro e performance.

Esse plano evita uma reescrita grande e transforma o app por camadas, mantendo o que ja funciona e criando uma base mais profissional para novas telas.
