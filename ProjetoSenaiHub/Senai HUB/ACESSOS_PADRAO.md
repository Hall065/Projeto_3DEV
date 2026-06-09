# Acessos padrão — SENAI HUB

Credenciais criadas pelo `UserSeeder` ao rodar `php artisan db:seed`.  
**Uso exclusivo para desenvolvimento e testes locais.**

## URLs locais

| Serviço | URL |
|---------|-----|
| Frontend (React) | http://127.0.0.1:5173 |
| Backend (Laravel API) | http://127.0.0.1:8000 |
| API (via frontend) | http://127.0.0.1:5173/api |

## Senhas padrão

| Tipo | Senha |
|------|-------|
| Administrador | `password` |
| Demais usuários | `password123` |

## Administrador (acesso total)

| Nome | E-mail | Perfil | Módulo |
|------|--------|--------|--------|
| Administrador SENAI | `admin@senaihub.local` | Administrador | Hub |

## Connect — Professores

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Carlos Professor | `carlos.professor@senai.local` | Professor (Connect) | Alunos, Turmas, Cursos, Frequência, Gerenciar Frequência, Relatório, Localização, Planilhas |
| Patricia Professor | `patricia.professor@senai.local` | Professor (Connect) | Idem |

> Escopo: vê apenas alunos, turmas e frequência das turmas em que leciona.

## Connect — Secretaria

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Fernanda Secretaria | `fernanda.secretaria@senai.local` | Secretaria (Connect) | Alunos, Professores, Turmas, Cursos, Relatório, Localização, Planilhas |
| Luciana Secretaria | `luciana.secretaria@senai.local` | Secretaria (Connect) | Idem |

## Connect — Diretor

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Roberto Diretor | `roberto.diretor@senai.local` | Diretor (Connect) | Pessoas, Alunos, Professores, Turmas, Cursos, Relatório, Localização, Planilhas, Contratos |

## Connect — AQV

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Ricardo AQV | `ricardo.aqv@senai.local` | AQV (Connect) | Alunos, Professores, Turmas, Cursos, Relatório, Localização, Planilhas, Contratos |
| Simone AQV | `simone.aqv@senai.local` | AQV (Connect) | Idem |

## Connect — Alunos

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Maria Silva | `maria.aluno@senai.local` | Aluno (Connect) | Professores, Turmas, Cursos, Frequência, Localização, Contratos, Salário |
| Joao Aluno | `joao.aluno@senai.local` | Aluno (Connect) | Idem |

> Escopo: vê apenas os próprios dados acadêmicos.

## Connect — Empresas parceiras

| Nome | E-mail | Empresa | Perfil | Abas |
|------|--------|---------|--------|------|
| Industria ABC | `empresa.abc@parceiro.local` | Indústria Metalúrgica ABC | Empresa parceira (Connect) | Alunos, Cursos, Frequência, Relatório, Contratos, Salário |
| MetalTech Parceira | `empresa.metaltech@parceiro.local` | MetalTech Indústria | Empresa parceira (Connect) | Idem |

> Escopo: vê apenas alunos com contrato vinculado à empresa.

## Grid — Gerente de manutenção

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Joao Gerente Manutencao | `joao.chefe@grid.senai.local` | Gerente de manutenção (Grid) | Dashboard, Controle, Chamados, Tarefas, Relatórios, Estoque, Mapa, Planilhas |
| Carlos Chefe Manutencao | `carlos.chefe@grid.senai.local` | Gerente de manutenção (Grid) | Idem |

## Grid — Técnicos de manutenção

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Pedro Tecnico | `pedro.tecnico@grid.senai.local` | Técnico de manutenção (Grid) | Chamados, Tarefas, Mapa, Estoque |
| Julia Tecnica | `julia.tecnica@grid.senai.local` | Técnico de manutenção (Grid) | Idem |

> Escopo: vê chamados e tarefas **delegados** a ele (ex.: `#CH-2026-ROLE-T1`).

## Grid — Professor

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Marcos Professor Grid | `marcos.professor@grid.senai.local` | Professor (Grid) | Chamados, Tarefas |

> Escopo: vê apenas chamados/tarefas que **ele abriu** (ex.: `#CH-2026-ROLE-P1`).

## Grid — Secretaria

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Sandra Secretaria Grid | `sandra.secretaria@grid.senai.local` | Secretaria (Grid) | Chamados, Tarefas |

> Escopo: vê apenas chamados/tarefas que **ela abriu** (ex.: `#CH-2026-ROLE-S1`).

## SAFE — Controle de entradas/saídas

| Nome | E-mail | Perfil | Abas |
|------|--------|--------|------|
| Ana AQV | `ana.aqv@safe.senai.local` | AQV (SAFE) | Dashboard, Alunos, Autorizações |
| Marcos Professor SAFE | `marcos.professor@safe.senai.local` | Professor (SAFE) | Dashboard, Aprovações |
| Helena Portaria | `helena.portaria@safe.senai.local` | Portaria (SAFE) | Dashboard, Portaria |

> Senha padrão: `password123`.

## Busca global

Atalho **Ctrl+K** (Windows/Linux) ou botão de busca na barra superior dos módulos Hub, Connect, Grid e SAFE.

| Aspecto | Comportamento |
|---------|----------------|
| Endpoint | `GET /api/search?q=...` (mínimo 2 caracteres) |
| Escopo | Resultados filtrados pelas permissões do usuário logado |
| Connect | Alunos, turmas, cursos, professores (conforme perfil) |
| Grid | Chamados (`#CH-...`), tarefas, itens de estoque |
| SAFE | Não incluído na busca global nesta versão |

A busca usa debounce de 250 ms no frontend (`GlobalSearchPalette`).

## Sugestões rápidas de teste

| Cenário | E-mail sugerido |
|---------|-----------------|
| Acesso total / gestão de usuários | `admin@senaihub.local` |
| Turmas e frequência (professor Connect) | `carlos.professor@senai.local` |
| Cadastros acadêmicos (secretaria Connect) | `fernanda.secretaria@senai.local` |
| Visão ampla + contratos (diretor Connect) | `roberto.diretor@senai.local` |
| Relatórios e indicadores (AQV) | `ricardo.aqv@senai.local` |
| Visão do aluno | `maria.aluno@senai.local` |
| Visão da empresa parceira | `empresa.abc@parceiro.local` |
| Gestão completa Grid (gerente) | `joao.chefe@grid.senai.local` |
| Chamados delegados (técnico Grid) | `pedro.tecnico@grid.senai.local` |
| Chamados próprios (professor Grid) | `marcos.professor@grid.senai.local` |
| Chamados próprios (secretaria Grid) | `sandra.secretaria@grid.senai.local` |
| Fluxo SAFE (AQV) | `ana.aqv@safe.senai.local` |
| Aprovação professor (SAFE) | `marcos.professor@safe.senai.local` |
| Portaria (SAFE) | `helena.portaria@safe.senai.local` |

## Recriar os dados de teste

Na pasta `Senai HUB/backend`:

```bash
php artisan migrate --force
php artisan db:seed --force
```

## Observações

- Os perfis e permissões estão definidos em `backend/config/permissions.php`.
- Usuários novos criados pelo admin podem iniciar **sem acesso** até configurar módulo, perfil e abas em `/hub/usuarios`.
- O `ConnectSeeder` e o `GridSeeder` criam dados adicionais (turmas, alunos, chamados, estoque).
- Chamados de demonstração para escopo por perfil: `#CH-2026-ROLE-P1`, `#CH-2026-ROLE-S1`, `#CH-2026-ROLE-T1`.
- O app mobile (`Mobile/senai-hub-app`) usa autenticação via Supabase e possui credenciais de teste próprias, separadas deste ambiente Laravel.
