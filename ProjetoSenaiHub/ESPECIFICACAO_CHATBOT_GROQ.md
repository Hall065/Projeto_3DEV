# Especificacao do Chatbot Groq para o SENAI Hub

Data: 13/06/2026

Este documento descreve as especificacoes tecnicas, funcionais e de seguranca para implementar um chatbot no aplicativo `senai-hub-app`, usando a API da Groq em um backend Python. O objetivo e permitir que o usuario converse com um assistente profissional capaz de responder perguntas sobre o aplicativo e consultar dados reais do banco de dados, como quantidade de alunos cadastrados, alunos cadastrados hoje, resumo de frequencia, chamados, tarefas, estoque e outros indicadores do SENAI Hub.

## 1. Objetivo da funcionalidade

Criar um assistente conversacional dentro do aplicativo mobile `ProjetoSenaiHub/Mobile/senai-hub-app`, acessado por um botao flutuante discreto no canto inferior direito da tela.

O chatbot deve:

- Responder em portugues do Brasil, com tom profissional, claro e objetivo.
- Consultar dados reais do Supabase antes de responder perguntas sobre numeros, cadastros, dashboards, alunos, professores, turmas, cursos, chamados, tarefas, estoque e demais areas do app.
- Salvar o historico das conversas por usuario logado.
- Permitir que o usuario continue uma conversa anterior ou inicie uma nova conversa.
- Usar a API da Groq apenas no backend Python, nunca diretamente no aplicativo mobile.
- Respeitar permissoes de acesso conforme o tipo de usuario logado.

## 2. Escopo visual no aplicativo

### 2.1 Botao flutuante

Adicionar um botao circular pequeno no canto inferior direito da tela.

Requisitos:

- Posicao: canto inferior direito, acima da barra de navegacao ou area segura do dispositivo.
- Tamanho recomendado: `52x52`.
- Formato: circulo com `borderRadius: 26`.
- Icone: icone de mensagem, chat ou assistente.
- Cor: usar cor primaria do design system do app, mantendo contraste adequado no modo claro e escuro.
- Elevacao/sombra: leve, apenas para separar o botao do conteudo.
- Nao deve bloquear botoes importantes da tela.
- Deve respeitar `SafeAreaView` e `useSafeAreaInsets`.
- Deve ter `accessibilityLabel`, por exemplo: `Abrir assistente SENAI Hub`.

Sugestao de posicionamento:

```ts
{
  position: 'absolute',
  right: 18,
  bottom: Math.max(insets.bottom + 72, 84),
  width: 52,
  height: 52,
  borderRadius: 26,
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  elevation: 8
}
```

### 2.2 Modal de conversa

Ao tocar no botao, abrir um modal de conversa.

O modal deve conter:

- Cabecalho com titulo `Assistente SENAI Hub`.
- Botao para fechar.
- Estado para selecionar conversa anterior ou criar nova conversa.
- Lista de mensagens da conversa atual.
- Campo de texto para digitar pergunta.
- Botao de envio.
- Estado de carregamento enquanto o bot responde.
- Tratamento visual de erro quando o backend estiver indisponivel.
- Sugestoes iniciais de perguntas uteis.

Sugestoes iniciais:

- `Quantos alunos existem cadastrados?`
- `Quantos alunos foram cadastrados hoje?`
- `Resumo dos chamados abertos`
- `Como esta a frequencia das turmas?`
- `Quais itens estao com estoque critico?`

O modal deve funcionar bem em telas pequenas. Em celular, ocupar quase a tela inteira. Em tablet/web, pode ocupar largura maxima de aproximadamente `480px`.

## 3. Arquitetura recomendada

### 3.1 Visao geral

A arquitetura deve ser:

```txt
senai-hub-app (Expo/React Native)
        |
        | HTTP/REST
        v
Backend Python do chatbot
        |
        | Consulta segura com funcoes permitidas
        v
Supabase
        |
        | Contexto estruturado
        v
Groq API
        |
        | Resposta em linguagem natural
        v
senai-hub-app
```

Motivo: a chave da Groq nao deve ser colocada no bundle do aplicativo. O mobile deve chamar apenas o backend do chatbot.

### 3.2 Local recomendado para o backend

Criar uma pasta separada para o backend do chatbot:

```txt
ProjetoSenaiHub/
  chatbot/
    python.py
    requirements.txt
    .env.example
    README.md
```

O usuario pediu especificamente um arquivo `python.py`. Portanto, a implementacao pode usar esse nome. Se o projeto preferir um nome mais descritivo, usar `chatbot_server.py`, mas manter as instrucoes de execucao claras.

Comando esperado:

```bash
cd ProjetoSenaiHub/chatbot
python python.py
```

## 4. Bibliotecas recomendadas

### 4.1 Backend Python

Usar:

- `fastapi`: criacao da API HTTP.
- `uvicorn`: servidor local.
- `groq`: SDK oficial da Groq.
- `python-dotenv`: leitura do `.env`.
- `supabase`: cliente Python do Supabase.
- `pydantic`: validacao dos payloads.

Arquivo `requirements.txt` sugerido:

```txt
fastapi
uvicorn[standard]
groq
python-dotenv
supabase
pydantic
```

### 4.2 Frontend mobile

Usar componentes ja existentes do app sempre que possivel.

Componentes sugeridos:

```txt
src/components/chatbot/ChatbotFloatingButton.tsx
src/components/chatbot/ChatbotModal.tsx
src/components/chatbot/ConversationList.tsx
src/components/chatbot/ChatMessageBubble.tsx
src/components/chatbot/ChatInput.tsx
src/services/chatbot.service.ts
src/stores/chatbot.store.ts
```

Caso o app ja use Zustand, Context API ou outro padrao de estado, seguir o padrao existente.

## 5. Variaveis de ambiente

### 5.1 Backend Python

Criar um `.env` dentro de `ProjetoSenaiHub/chatbot`.

Variaveis:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CHATBOT_PORT=8000
CHATBOT_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

Observacoes:

- A Groq recomenda usar a variavel `GROQ_API_KEY`.
- Se o projeto atual ja possui uma chave com outro nome, como `EXPO_API_GROQ`, o backend pode aceitar esse nome como fallback, mas a recomendacao e migrar/copiar para `GROQ_API_KEY`.
- Nunca expor a chave da Groq em variavel `EXPO_PUBLIC_*`.
- Nunca chamar a Groq diretamente pelo app mobile.
- `SUPABASE_SERVICE_ROLE_KEY` deve ficar somente no backend. Nao usar essa chave no mobile.

### 5.2 App mobile

No app Expo, adicionar apenas a URL da API do chatbot:

```env
EXPO_PUBLIC_CHATBOT_API_URL=http://localhost:8000
```

Em producao, trocar pelo dominio real da API.

## 6. Contrato da API

### 6.1 Health check

```http
GET /health
```

Resposta:

```json
{
  "status": "ok",
  "service": "senai-hub-chatbot"
}
```

### 6.2 Listar conversas do usuario

```http
GET /conversations
Authorization: Bearer <supabase_access_token>
```

Resposta:

```json
[
  {
    "id": "uuid",
    "titulo": "Resumo academico",
    "status": "ativa",
    "created_at": "2026-06-13T10:00:00Z",
    "updated_at": "2026-06-13T10:15:00Z"
  }
]
```

### 6.3 Criar nova conversa

```http
POST /conversations
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Body:

```json
{
  "titulo": "Nova conversa"
}
```

Resposta:

```json
{
  "id": "uuid",
  "titulo": "Nova conversa",
  "status": "ativa"
}
```

### 6.4 Buscar mensagens de uma conversa

```http
GET /conversations/{conversation_id}/messages
Authorization: Bearer <supabase_access_token>
```

Resposta:

```json
[
  {
    "id": "uuid",
    "role": "user",
    "conteudo": "Quantos alunos existem cadastrados?",
    "created_at": "2026-06-13T10:00:00Z"
  },
  {
    "id": "uuid",
    "role": "assistant",
    "conteudo": "Atualmente existem 128 alunos cadastrados no SENAI Connect.",
    "created_at": "2026-06-13T10:00:02Z"
  }
]
```

### 6.5 Enviar mensagem para o chatbot

```http
POST /chat
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

Body:

```json
{
  "conversation_id": "uuid",
  "message": "Quantos alunos foram cadastrados hoje?"
}
```

Resposta:

```json
{
  "conversation_id": "uuid",
  "message": {
    "id": "uuid",
    "role": "assistant",
    "conteudo": "Hoje, 13/06/2026, foram cadastrados 4 alunos no SENAI Connect.",
    "created_at": "2026-06-13T10:05:00Z"
  },
  "metadata": {
    "model": "llama-3.3-70b-versatile",
    "tools_used": ["count_alunos_cadastrados_hoje"]
  }
}
```

## 7. Persistencia no banco de dados

Criar tabelas no schema `hub` para armazenar conversas e mensagens.

### 7.1 Tabela `hub.chatbot_conversas`

Campos:

- `id uuid primary key default gen_random_uuid()`
- `usuario_id uuid not null`
- `titulo text not null default 'Nova conversa'`
- `status text not null default 'ativa'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 7.2 Tabela `hub.chatbot_mensagens`

Campos:

- `id uuid primary key default gen_random_uuid()`
- `conversa_id uuid not null references hub.chatbot_conversas(id) on delete cascade`
- `usuario_id uuid not null`
- `role text not null`
- `conteudo text not null`
- `metadata jsonb default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Valores permitidos para `role`:

- `user`
- `assistant`
- `system`

### 7.3 RLS e seguranca

Ativar RLS nas duas tabelas.

Regras:

- O usuario so pode listar conversas em que `usuario_id` seja o seu proprio id.
- O usuario so pode listar mensagens vinculadas as suas conversas.
- O backend com service role pode inserir mensagens e atualizar conversas.
- O app mobile nunca deve receber `SUPABASE_SERVICE_ROLE_KEY`.

## 8. Dados que o chatbot pode consultar

O chatbot deve consultar dados do banco por funcoes seguras e predefinidas. A IA nao deve gerar SQL livre diretamente.

### 8.1 Schemas principais

O app utiliza dados organizados por areas:

- `hub`: usuarios, autenticacao, perfis e dados compartilhados.
- `connect`: alunos, professores, cursos, turmas, frequencias, contratos, salarios, empresas e localizacoes.
- `grid`: chamados, tarefas, estoque, categorias, fornecedores e usuarios operacionais.

### 8.2 Funcoes de consulta permitidas

Implementar funcoes internas no backend Python:

```txt
get_user_context()
get_dashboard_counts()
count_alunos()
count_alunos_cadastrados_hoje()
count_professores()
count_turmas()
count_cursos()
get_frequencia_resumo()
get_contratos_resumo()
get_salarios_resumo()
get_alunos_por_curso()
get_alunos_por_turma()
get_grid_chamados_resumo()
get_grid_tarefas_resumo()
get_estoque_critico()
get_ultimas_atualizacoes()
```

Cada funcao deve:

- Validar permissao do usuario antes de consultar dados.
- Retornar dados estruturados em JSON.
- Evitar retornar dados sensiveis sem necessidade.
- Retornar mensagem clara quando nao houver dados.
- Registrar erros no backend sem expor detalhes tecnicos ao usuario final.

### 8.3 Exemplo de consulta segura

Pergunta:

```txt
Quantos alunos foram cadastrados hoje?
```

Fluxo:

1. Backend identifica usuario pelo token Supabase.
2. Backend verifica se o usuario pode acessar dados do SENAI Connect.
3. Backend executa `count_alunos_cadastrados_hoje()`.
4. Backend envia para a Groq apenas o contexto necessario:

```json
{
  "pergunta": "Quantos alunos foram cadastrados hoje?",
  "dados_consultados": {
    "data": "2026-06-13",
    "total_alunos_cadastrados_hoje": 4
  }
}
```

5. Groq gera resposta profissional:

```txt
Hoje, 13/06/2026, foram cadastrados 4 alunos no SENAI Connect.
```

Se a tabela de alunos ainda nao possuir campo de data de cadastro, criar ou padronizar um campo como `created_at` ou `criado_em`. Sem esse campo, o chatbot deve informar que consegue ver o total atual, mas nao consegue calcular cadastros do dia com confianca.

## 9. Permissoes por perfil

O chatbot deve respeitar o mesmo nivel de acesso do app.

Regras recomendadas:

- `admin`: pode consultar indicadores gerais de todos os modulos.
- `secretaria` ou perfil administrativo do Connect: pode consultar alunos, cursos, turmas, professores, frequencias e contratos.
- `professor`: pode consultar apenas turmas, alunos e frequencias vinculadas a ele.
- `aluno`: pode consultar apenas seus proprios dados, frequencia, curso, turma e informacoes permitidas.
- `empresa`: pode consultar apenas alunos, contratos ou informacoes vinculadas a empresa.
- `grid_admin` ou equipe Grid: pode consultar chamados, tarefas, estoque e indicadores operacionais.

Se o usuario pedir algo sem permissao, responder:

```txt
Nao consigo acessar essa informacao com o seu perfil atual. Posso ajudar com os dados disponiveis para a sua conta.
```

## 10. Comportamento do chatbot

### 10.1 Nome e personalidade

Nome sugerido:

```txt
Assistente SENAI Hub
```

Tom:

- Profissional.
- Educado.
- Direto.
- Prestativo.
- Sem linguagem infantil.
- Sem inventar dados.
- Sem expor detalhes internos do banco quando nao for necessario.

### 10.2 Regras obrigatorias de resposta

O chatbot deve seguir estas regras:

1. Responder sempre em portugues do Brasil.
2. Quando a pergunta envolver dados do app, consultar o backend antes de responder.
3. Nunca inventar numeros, nomes, metricas ou datas.
4. Quando nao encontrar dados, informar com clareza.
5. Quando nao tiver permissao, explicar de forma educada.
6. Quando a pergunta for ambigua, pedir uma confirmacao curta.
7. Usar datas absolutas quando falar de `hoje`, `ontem`, `semana atual` ou periodos.
8. Manter respostas curtas, mas completas.
9. Oferecer proximo passo quando fizer sentido.
10. Nao revelar chaves, tokens, SQL interno, service role ou detalhes sensiveis.

Observacao: a regra 6 significa pedir uma pequena confirmacao quando a pergunta estiver incompleta.

### 10.3 Prompt de sistema sugerido

Usar este texto como base no backend:

```txt
Voce e o Assistente SENAI Hub, um chatbot profissional integrado ao aplicativo SENAI Hub.

Sua funcao e ajudar usuarios a entender informacoes do aplicativo e responder perguntas sobre dados reais do sistema, como alunos, professores, cursos, turmas, frequencia, contratos, salarios, chamados, tarefas, estoque e indicadores dos dashboards.

Regras:
- Responda sempre em portugues do Brasil.
- Seja profissional, claro e objetivo.
- Nao invente dados. Quando a pergunta depender do banco, use apenas os dados fornecidos pelas ferramentas do backend.
- Se nao houver dados suficientes, informe isso de forma transparente.
- Se o usuario nao tiver permissao para acessar uma informacao, diga que nao pode acessar com o perfil atual.
- Nao exponha chaves, tokens, SQL interno, logs tecnicos ou dados sensiveis.
- Ao responder metricas, cite o periodo usado, por exemplo: "hoje, 13/06/2026" ou "nos ultimos 7 dias".
- Quando fizer sentido, sugira uma proxima pergunta ou acao.
- Mantenha respostas curtas para caber bem na interface mobile.
```

## 11. Exemplos de conversas esperadas

### 11.1 Total de alunos

Usuario:

```txt
Quantos alunos tem cadastrados?
```

Resposta esperada:

```txt
Atualmente existem 128 alunos cadastrados no SENAI Connect.
```

### 11.2 Cadastros do dia

Usuario:

```txt
Quantos alunos foram cadastrados hoje?
```

Resposta esperada:

```txt
Hoje, 13/06/2026, foram cadastrados 4 alunos no SENAI Connect.
```

### 11.3 Sem permissao

Usuario:

```txt
Mostre os salarios dos alunos.
```

Resposta esperada para perfil sem permissao:

```txt
Nao consigo acessar informacoes salariais com o seu perfil atual. Posso ajudar com os dados academicos disponiveis para a sua conta.
```

### 11.4 Dados inexistentes

Usuario:

```txt
Quantos alunos foram cadastrados hoje?
```

Resposta caso nao exista campo de data de cadastro:

```txt
Consigo consultar o total atual de alunos, mas ainda nao ha um campo de data de cadastro confiavel para calcular quantos foram cadastrados hoje.
```

## 12. Fluxo interno do endpoint `/chat`

Fluxo recomendado:

1. Receber `conversation_id` e `message`.
2. Validar token Supabase recebido no header `Authorization`.
3. Identificar usuario logado e perfil.
4. Salvar mensagem do usuario em `hub.chatbot_mensagens`.
5. Classificar intencao da pergunta:
   - pergunta geral sobre o app;
   - pergunta sobre dados do Connect;
   - pergunta sobre dados do Grid;
   - pergunta sobre dados do proprio usuario;
   - pergunta fora do escopo.
6. Executar uma ou mais funcoes permitidas de consulta.
7. Montar contexto estruturado para a Groq.
8. Chamar `client.chat.completions.create`.
9. Salvar resposta do assistente.
10. Retornar resposta para o app.

## 13. Exemplo base do backend Python

Este exemplo e apenas uma base. A IA responsavel pela implementacao deve completar validacao, persistencia, permissoes e ferramentas de consulta.

```py
import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("EXPO_API_GROQ")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

if not GROQ_API_KEY:
    raise RuntimeError("Configure GROQ_API_KEY no .env do backend do chatbot.")

groq_client = Groq(api_key=GROQ_API_KEY)
app = FastAPI(title="SENAI Hub Chatbot")

class ChatRequest(BaseModel):
    conversation_id: str
    message: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "senai-hub-chatbot"}

@app.post("/chat")
def chat(payload: ChatRequest, authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token ausente.")

    # 1. Validar token Supabase.
    # 2. Buscar usuario e permissoes.
    # 3. Salvar mensagem do usuario.
    # 4. Consultar dados reais por funcoes permitidas.
    # 5. Enviar pergunta + contexto para Groq.

    system_prompt = "Voce e o Assistente SENAI Hub. Responda em portugues do Brasil."

    completion = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload.message},
        ],
        temperature=0.2,
    )

    answer = completion.choices[0].message.content

    # 6. Salvar resposta do assistente.
    return {
        "conversation_id": payload.conversation_id,
        "message": {
            "role": "assistant",
            "conteudo": answer,
        },
        "metadata": {
            "model": GROQ_MODEL
        }
    }
```

Comando de execucao:

```bash
uvicorn python:app --host 0.0.0.0 --port 8000 --reload
```

## 14. Integracao com o frontend

### 14.1 Service HTTP

Criar `src/services/chatbot.service.ts`.

Responsabilidades:

- Ler `EXPO_PUBLIC_CHATBOT_API_URL`.
- Enviar token Supabase no header `Authorization`.
- Listar conversas.
- Criar conversa.
- Buscar mensagens.
- Enviar mensagem.
- Tratar erro de conexao.

Exemplo de interface:

```ts
export type ChatMessage = {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  conteudo: string;
  created_at?: string;
};

export type ChatConversation = {
  id: string;
  titulo: string;
  status: 'ativa' | 'arquivada';
  created_at?: string;
  updated_at?: string;
};
```

### 14.2 Estado da conversa

O app deve controlar:

- `isOpen`: modal aberto ou fechado.
- `conversations`: conversas do usuario.
- `activeConversationId`: conversa atual.
- `messages`: mensagens da conversa atual.
- `isSending`: envio em andamento.
- `error`: erro amigavel para exibir no modal.

### 14.3 Onde montar o botao

Adicionar o `ChatbotFloatingButton` no layout principal autenticado do app, nao na tela de login.

Regras:

- O botao deve aparecer nas telas principais depois que o usuario estiver logado.
- O botao pode ser ocultado em telas de formulario em tela cheia, camera, mapa 3D ou telas onde atrapalhe a interacao.
- O modal deve continuar preservando o historico ao fechar.

## 15. Performance

Requisitos:

- Carregar historico de conversa apenas quando o modal abrir.
- Paginar mensagens antigas se uma conversa ficar grande.
- Enviar para a Groq somente o contexto necessario.
- Limitar tamanho maximo da mensagem do usuario.
- Usar `temperature` baixa, entre `0.1` e `0.3`, para respostas mais consistentes.
- Evitar animacoes pesadas no botao e no modal.
- Manter respostas curtas para melhorar tempo de leitura no mobile.

## 16. Acessibilidade

Requisitos:

- Botao com `accessibilityRole="button"`.
- Botao com `accessibilityLabel`.
- Modal com foco inicial no campo de mensagem.
- Contraste adequado no modo claro e escuro.
- Mensagens diferenciadas por alinhamento, texto e cor, nao somente por cor.
- Respeitar configuracao de reduzir movimento do sistema.
- Campo de texto com placeholder claro.
- Indicador de carregamento com texto acessivel, por exemplo `Assistente respondendo`.

## 17. Tratamento de erros

Mensagens amigaveis:

- Backend offline:

```txt
Nao consegui conectar ao assistente agora. Verifique sua conexao e tente novamente.
```

- Groq indisponivel:

```txt
O assistente esta temporariamente indisponivel. Tente novamente em alguns instantes.
```

- Sem permissao:

```txt
Nao consigo acessar essa informacao com o seu perfil atual.
```

- Pergunta fora do escopo:

```txt
Posso ajudar principalmente com informacoes do SENAI Hub, como alunos, turmas, cursos, frequencia, chamados, tarefas e estoque.
```

## 18. Criterios de aceite

A implementacao sera considerada pronta quando:

- O botao circular aparecer no canto inferior direito apos login.
- O botao nao atrapalhar a navegacao principal.
- Ao tocar no botao, abrir modal de conversa.
- O usuario conseguir criar nova conversa.
- O usuario conseguir continuar conversa anterior.
- Mensagens forem salvas no Supabase por usuario.
- O chatbot responder usando Groq.
- Perguntas sobre dados reais consultarem o Supabase antes da resposta.
- A chave da Groq nao estiver exposta no frontend.
- O backend validar token do usuario.
- O bot respeitar permissoes por perfil.
- O modo claro e escuro ficarem legiveis.
- Erros forem exibidos de forma amigavel.
- O app continuar funcionando caso o backend do chatbot esteja offline.

## 19. Ordem recomendada de implementacao

1. Criar tabelas `hub.chatbot_conversas` e `hub.chatbot_mensagens`.
2. Criar backend Python com `/health`.
3. Configurar `.env` do backend com `GROQ_API_KEY`.
4. Implementar validacao do token Supabase.
5. Implementar persistencia de conversas e mensagens.
6. Implementar endpoint `/chat` com resposta simples da Groq.
7. Criar funcoes seguras para consultar dados reais do Supabase.
8. Conectar as funcoes de consulta ao fluxo do chatbot.
9. Criar `chatbot.service.ts` no app.
10. Criar componentes visuais do botao e modal.
11. Integrar botao no layout autenticado.
12. Testar perguntas reais de dashboard.
13. Testar permissoes por perfil.
14. Testar modo claro e escuro.
15. Testar comportamento offline e mensagens de erro.

## 20. Referencias tecnicas

- Groq Quickstart: https://console.groq.com/docs/quickstart
- Compatibilidade da Groq com padrao OpenAI: https://console.groq.com/docs/openai

Pontos importantes das referencias:

- A Groq recomenda configurar a chave em `GROQ_API_KEY`.
- O SDK Python usa `from groq import Groq`.
- A chamada principal usa `client.chat.completions.create(...)`.
- A Groq tambem oferece compatibilidade com o padrao OpenAI em `https://api.groq.com/openai/v1`.

## 21. Observacoes finais para a IA implementadora

- Nao colocar chave da Groq no frontend.
- Nao expor `SUPABASE_SERVICE_ROLE_KEY` no app mobile.
- Nao deixar o LLM gerar SQL livre.
- Usar funcoes permitidas para consultar dados.
- Manter o layout consistente com o design system atual do app.
- Preservar compatibilidade com modo claro e escuro.
- Tratar todos os estados: carregando, vazio, erro, enviando e sucesso.
- Nao criar respostas falsas quando o banco nao tiver a informacao.
- Antes de finalizar, testar pelo menos:
  - `Quantos alunos tem cadastrados?`
  - `Quantos alunos foram cadastrados hoje?`
  - `Resumo dos chamados abertos`
  - `Quais itens estao com estoque critico?`
  - `Quais informacoes eu posso consultar com meu perfil?`
