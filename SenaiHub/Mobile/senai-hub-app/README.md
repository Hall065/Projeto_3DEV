# SENAI HUB App

Aplicação mobile **React Native + Expo** — hub de acesso ao **SENAI Connect** (acadêmico) e **SENAI Grid** (manutenção predial).

## Stack

- Expo Router (navegação por arquivos)
- TypeScript
- Supabase (Auth + PostgreSQL + Realtime + Edge Functions)
- Cloudinary (mídia e documentos)
- Zustand, React Hook Form, Zod

## Estrutura

```
app/           # Rotas (login, hub, connect/*, grid/*)
src/
  components/  # Design system (AppHeader, BottomNav, etc.)
  lib/         # Supabase, auth, permissions, geofence
  services/    # Camada de API
  stores/      # Estado global
  types/       # Tipos TypeScript
  constants/   # Cores, rotas, perfis
  utils/       # Validadores e formatadores
supabase/
  migrations/  # SQL do banco
  functions/   # Edge Functions
```

## Configuração

1. Copie `.env.example` para `.env` e preencha as chaves públicas:

```bash
cp .env.example .env
```

2. **URL do Supabase:** use apenas a base (`https://xxx.supabase.co`), sem `/rest/v1/`.

3. Instale dependências e inicie:

```bash
npm install
npx expo start
```

## Fluxo principal

1. Login (`/login`) — Supabase Auth
2. Hub (`/hub`) — cards Connect e Grid conforme permissões
3. Módulos `/connect/*` e `/grid/*`

## Próximos passos

- Aplicar migrações SQL e RLS no Supabase
- Popular dados iniciais (aplicações, blocos, salas)
- Implementar CRUD completo por módulo
- Configurar deep link `senaihubapp://redefinir-senha` para recuperação de senha

Documento de referência: `../Ideia/ideia/PRD_SENAI_HUB_React_Expo_Supabase_Cloudinary.md`
