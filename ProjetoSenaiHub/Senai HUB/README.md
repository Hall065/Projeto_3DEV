# SENAI HUB

Plataforma integrada com os módulos **Connect** (gestão acadêmica), **Grid** (manutenção e estoque) e **SAFE** (controle de entradas/saídas escolares).

## Pré-requisitos

| Ferramenta | Versão sugerida |
|------------|-----------------|
| PHP | 8.3+ |
| Composer | 2.x |
| Node.js | 20+ |
| npm | 10+ |

Extensões PHP: `pdo`, `sqlite` (dev) ou driver MySQL/PostgreSQL em produção.

## Estrutura

```
Senai HUB/
├── backend/     # API Laravel (Sanctum)
├── frontend/    # SPA React + Vite + Tailwind
├── ACESSOS_PADRAO.md
└── SUGESTOES_MELHORIAS.md
```

## Setup rápido (desenvolvimento)

### 1. Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API disponível em `http://127.0.0.1:8000`. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://127.0.0.1:5173`. O Vite faz proxy de `/api` para o Laravel (ver `vite.config.ts`).

Variável opcional no `.env` do frontend:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Se omitida, o proxy local (`/api`) é usado automaticamente.

### 3. Credenciais de teste

Consulte **[ACESSOS_PADRAO.md](./ACESSOS_PADRAO.md)** — admin padrão: `admin@senaihub.local` / `password`.

## Comandos úteis

| Comando | Onde | Descrição |
|---------|------|-----------|
| `php artisan test` | backend | Testes PHPUnit |
| `php artisan hub:sync-permissions-frontend` | backend | Gera `frontend/src/generated/permissionKeys.ts` |
| `php artisan db:seed --force` | backend | Recria dados de demo |
| `npm run build` | frontend | Typecheck + build produção |
| `npm run lint` | frontend | ESLint |

## E-mails em desenvolvimento

No `.env` do backend, `HUB_REDIRECT_ALL_MAIL=true` redireciona notificações e reset de senha para `HUB_NOTIFICATION_EMAIL` (padrão: `hall065.2022@gmail.com`).

## Administração

- **Usuários e permissões:** `/hub/usuarios` (apenas administrador).
- **Cadastro público:** desabilitado — novos usuários são criados pelo admin.
- **Filament:** pacote instalado no backend, **não utilizado**; gestão feita pela interface React do Hub.

## Solicitar acesso

Usuários sem conta podem enviar pedido em **`/solicitar-acesso`** (também link no login e na tela de aguardando liberação). O admin recebe notificação in-app em `/hub/usuarios`.

## Testes E2E

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

## Busca global

Atalho **Ctrl+K** (ou botão na barra superior dos módulos). Detalhes em [ACESSOS_PADRAO.md](./ACESSOS_PADRAO.md#busca-global).

## Mobile

O app em `Mobile/senai-hub-app` usa Supabase e é um produto separado da API Laravel deste repositório (ver tópico 24 em `SUGESTOES_MELHORIAS.md`).

## Referências

- Backlog e status de melhorias: `SUGESTOES_MELHORIAS.md`
- Permissões: `backend/config/permissions.php`, `frontend/src/config/navPermissions.ts`
- Escopo por perfil: `backend/app/Support/UserAccessScope.php`
