# SENAI Hub Chatbot

Backend Python do chatbot do SENAI Hub. Ele recebe mensagens do app mobile, valida o token do Supabase, consulta dados permitidos no banco, salva o historico da conversa e chama a Groq.

## Configuracao

1. Crie um ambiente virtual Python, se desejar.
2. Instale as dependencias:

```bash
pip install -r requirements.txt
```

3. Copie `.env.example` para `.env` e preencha:

```env
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Observacao: se a chave da Groq estiver no `.env` do app mobile como `EXPO_API_GROQ`, este backend tambem tenta ler esse arquivo como fallback em desenvolvimento. Em producao, use `GROQ_API_KEY` no ambiente do backend.

## Execucao

```bash
python python.py
```

Ou:

```bash
uvicorn python:app --host 0.0.0.0 --port 8000 --reload
```

No app Expo, configure:

```env
EXPO_PUBLIC_CHATBOT_API_URL=http://localhost:8000
```

Em Android Emulator, normalmente use `http://10.0.2.2:8000`.
