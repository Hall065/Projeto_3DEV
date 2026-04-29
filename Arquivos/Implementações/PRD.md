# PRD — PredialFix: Documento de Requisitos do Produto

> **Versão:** 1.0  
> **Data:** Abril 2026  
> **Status:** Em Desenvolvimento  
> **Stack Principal:** Laravel 11 + Filament 3 + Breeze + Blade + Laragon

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Objetivos e Metas](#2-objetivos-e-metas)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura do Projeto Laravel](#4-estrutura-do-projeto-laravel)
5. [Arquitetura e Fluxo de Dados](#5-arquitetura-e-fluxo-de-dados)
6. [Estrutura da Página — Diagrama Inicial](#6-estrutura-da-página--diagrama-inicial)
7. [Identidade Visual e Design System](#7-identidade-visual-e-design-system)
8. [Páginas e Componentes Detalhados](#8-páginas-e-componentes-detalhados)
9. [Sistema de Autenticação (Breeze)](#9-sistema-de-autenticação-breeze)
10. [Painel Administrativo (Filament)](#10-painel-administrativo-filament)
11. [Models e Banco de Dados](#11-models-e-banco-de-dados)
12. [Rotas e Controllers](#12-rotas-e-controllers)
13. [Componentes Blade](#13-componentes-blade)
14. [Assets e Recursos Visuais](#14-assets-e-recursos-visuais)
15. [Responsividade e Acessibilidade](#15-responsividade-e-acessibilidade)
16. [SEO e Performance](#16-seo-e-performance)
17. [Segurança](#17-segurança)
18. [Guia de Implementação Passo a Passo](#18-guia-de-implementação-passo-a-passo)
19. [Referências de Arquivos do Projeto](#19-referências-de-arquivos-do-projeto)

---

## 1. Visão Geral do Projeto

**PredialFix** é uma plataforma web voltada para gestão de manutenção predial de unidades do Senai. O sistema oferece uma landing page institucional altamente otimizada para conversão, além de um painel administrativo robusto para gerenciamento interno dos serviços.

### Propósito

Conectar gestores de unidade, diretorias regionais e prestadores de serviços de manutenção predial do Senai, centralizando a abertura, acompanhamento e resolução de chamados/ordens de serviço.

### Público-Alvo

| Perfil | Descrição |
|--------|-----------|
| **Gestores de Unidade** | Responsáveis por gerir os chamados e acompanhar o status das manutenções na unidade |
| **Colaboradores** | Podem abrir chamados e acompanhar o andamento |
| **Prestadores** | Técnicos e empresas que recebem e executam as ordens de serviço |
| **Diretorias Regionais** | Gestão de múltiplas unidades Senai |

---

## 2. Objetivos e Metas

### Objetivos Primários

- Criar uma landing page institucional com **alta taxa de conversão** (geração de leads e agendamentos)
- Disponibilizar um **painel administrativo** (Filament) para gestão completa
- Implementar um **sistema de autenticação** robusto com múltiplos perfis
- Garantir **identidade visual** consistente, seguindo 1:1 os protótipos do Figma

### KPIs do Produto

- Tempo de carregamento da landing page: < 2 segundos (LCP)
- Score Lighthouse: ≥ 90 em todas as métricas
- Taxa de conversão da landing page: ≥ 5%
- Acessibilidade (WCAG 2.1 nível AA)

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **PHP** | 8.2+ | Linguagem base |
| **Laravel** | 11.x | Framework backend |
| **Laragon** | 6.x | Ambiente de desenvolvimento local |
| **MySQL** | 8.0+ | Banco de dados principal |
| **Filament** | 3.x | Painel administrativo |
| **Laravel Breeze** | 2.x | Autenticação e scaffolding |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Blade** | (Laravel 11) | Template engine principal |
| **Tailwind CSS** | 3.x | Framework CSS utilitário |
| **Alpine.js** | 3.x | Interatividade leve no frontend |
| **Vite** | 5.x | Bundler e hot reload |
| **Livewire** | 3.x | Componentes reativos (onde aplicável) |

### Ferramentas e Extras

```
- Laravel Pint          → Formatação de código PHP
- Laravel Telescope     → Debug e monitoramento local
- Laravel Debugbar      → Debug visual no browser
- Spatie Media Library  → Gerenciamento de uploads e mídias
- Spatie Permissions    → Roles e permissões
- Intervention Image    → Processamento de imagens
- Laravel Scout         → Busca full-text
```

---

## 4. Estrutura do Projeto Laravel

> **Base de Referência:** `C:\Users\39039450803\Documents\Etheria\Projeto_3DEV\PredialFix`

A estrutura segue a arquitetura padrão do Laravel com as seguintes convenções do projeto:

```
PredialFix/
├── app/
│   ├── Filament/
│   │   ├── Resources/           → Resources do painel admin
│   │   │   ├── UserResource.php
│   │   │   ├── ChamadoResource.php
│   │   │   ├── UnidadeResource.php
│   │   │   └── ServicoResource.php
│   │   ├── Pages/               → Páginas customizadas do Filament
│   │   │   └── Dashboard.php
│   │   └── Widgets/             → Widgets do dashboard
│   │       ├── StatsOverview.php
│   │       ├── ChamadosChart.php
│   │       └── AtividadesRecentes.php
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── LandingController.php     → Controla a landing page
│   │   │   ├── ContatoController.php     → Formulário de contato/lead
│   │   │   ├── ChamadoController.php     → CRUD de chamados
│   │   │   └── Auth/                    → Controllers do Breeze
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   └── EnsureProfileComplete.php
│   │   └── Requests/
│   │       ├── ContatoRequest.php
│   │       └── ChamadoRequest.php
│   │
│   ├── Models/
│   │   ├── User.php
│   │   ├── Chamado.php
│   │   ├── Unidade.php
│   │   ├── Servico.php
│   │   ├── Lead.php
│   │   └── Categoria.php
│   │
│   ├── Services/
│   │   ├── LeadService.php
│   │   ├── NotificacaoService.php
│   │   └── ChamadoService.php
│   │
│   └── Policies/
│       ├── ChamadoPolicy.php
│       └── UnidadePolicy.php
│
├── resources/
│   ├── views/
│   │   ├── layouts/
│   │   │   ├── app.blade.php          → Layout principal autenticado
│   │   │   ├── landing.blade.php      → Layout da landing page
│   │   │   └── guest.blade.php        → Layout para não autenticados
│   │   │
│   │   ├── landing/
│   │   │   ├── index.blade.php        → Página principal (landing)
│   │   │   └── partials/
│   │   │       ├── hero.blade.php
│   │   │       ├── sobre.blade.php
│   │   │       ├── servicos.blade.php
│   │   │       ├── como-funciona.blade.php
│   │   │       ├── depoimentos.blade.php
│   │   │       ├── planos.blade.php
│   │   │       ├── faq.blade.php
│   │   │       ├── cta.blade.php
│   │   │       └── footer.blade.php
│   │   │
│   │   ├── components/
│   │   │   ├── navbar.blade.php
│   │   │   ├── logo.blade.php
│   │   │   ├── btn-primary.blade.php
│   │   │   ├── btn-secondary.blade.php
│   │   │   ├── card-servico.blade.php
│   │   │   ├── card-depoimento.blade.php
│   │   │   └── modal-contato.blade.php
│   │   │
│   │   └── auth/                      → Views do Breeze
│   │       ├── login.blade.php
│   │       ├── register.blade.php
│   │       └── forgot-password.blade.php
│   │
│   ├── css/
│   │   └── app.css                    → Tailwind + customizações
│   │
│   └── js/
│       ├── app.js                     → Alpine.js + scripts globais
│       └── landing.js                 → Scripts específicos da landing
│
├── public/
│   ├── images/
│   │   ├── logos/                     → Variações de logo (.png)
│   │   ├── background.png             → Imagem base de background
│   │   └── icons/
│   └── build/                         → Assets compilados pelo Vite
│
├── database/
│   ├── migrations/
│   └── seeders/
│
├── routes/
│   ├── web.php                        → Rotas web (landing + app)
│   └── api.php                        → Rotas de API (se necessário)
│
└── config/
    ├── filament.php
    └── predialfix.php                 → Configurações customizadas do app
```

---

## 5. Arquitetura e Fluxo de Dados

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   USUÁRIO FINAL                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              LANDING PAGE (Blade)                │
│  Hero → Serviços → Como Funciona → CTA → Footer  │
└──────────────────────┬──────────────────────────┘
                       │ Conversão / Login
                       ▼
┌─────────────────────────────────────────────────┐
│         AUTENTICAÇÃO (Laravel Breeze)            │
│         Login / Registro / Recuperação           │
└──────────────────────┬──────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────┐   ┌──────────────────────────┐
│  PORTAL DO       │   │  PAINEL ADMIN             │
│  USUÁRIO (Blade) │   │  (Filament /admin)        │
│  Chamados, Perfil│   │  CRUD completo, Relatórios│
└──────────────────┘   └──────────────────────────┘
           │                       │
           └───────────┬───────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│              CAMADA DE SERVIÇOS                  │
│     LeadService | ChamadoService | Notificações  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           BANCO DE DADOS (MySQL)                 │
│  users | chamados | unidades | leads | etc.   │
└─────────────────────────────────────────────────┘
```

### Roles do Sistema

```php
// Roles gerenciados via Spatie Permission
'super_admin'     → Acesso total ao Filament + todas as funcionalidades
'admin'           → Gestão de unidades e chamados
'gestor_unidade'  → Visualiza e aprova chamados da sua unidade Senai
'colaborador'     → Abre chamados e acompanha status
'prestador'       → Recebe e atualiza status das ordens de serviço
```

---

## 6. Estrutura da Página — Diagrama Inicial

> **Fonte:** `Diagrama_Inicial_Estrutura_da_Página.svg`

O diagrama SVG define a estrutura visual e de componentes da landing page dividida em **seções coloridas** que representam blocos funcionais distintos:

### Mapa de Seções (por cor no diagrama)

| Cor | Hex | Seção |
|-----|-----|-------|
| 🟠 Laranja | `#fc9432` | Navbar / Header e Footer |
| 🟢 Teal | `#00c2a8` | Hero Section e Área de Destaques |
| 🟡 Amarelo | `#fcce14` | Seção de Serviços / Features |
| 🟣 Roxo | `#e08fff` | Como Funciona / Processo |
| 🔵 Azul | `#1071e5` | Componentes internos (cards, botões, forms) |

### Hierarquia de Seções

```
┌──────────────────────────────────────────────────────────────┐
│  [NAVBAR / HEADER] 🟠                                         │
│  Logo | Menu (Início, Serviços, Como Funciona, Planos) | CTA  │
├──────────────────────────────────────────────────────────────┤
│  [HERO SECTION] 🟢                                            │
│  ┌─────────────────────┐  ┌───────────────────────────────┐  │
│  │  Headline Principal  │  │  Formulário de Contato/Lead   │  │
│  │  Sub-headline        │  │  Nome | E-mail | Telefone     │  │
│  │  CTA Button          │  │  [Botão: Solicitar Orçamento] │  │
│  └─────────────────────┘  └───────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  [SOBRE / DIFERENCIAIS] 🟢                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Card 1  │  │  Card 2  │  │  Card 3  │  │  Card 4  │     │
│  │ Ícone +  │  │ Ícone +  │  │ Ícone +  │  │ Ícone +  │     │
│  │  Título  │  │  Título  │  │  Título  │  │  Título  │     │
│  │  Texto   │  │  Texto   │  │  Texto   │  │  Texto   │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
├──────────────────────────────────────────────────────────────┤
│  [SERVIÇOS] 🟡                                                │
│  Título da Seção                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Serviço 1   │  │  Serviço 2   │  │  Serviço 3   │        │
│  │  Imagem/Icon │  │  Imagem/Icon │  │  Imagem/Icon │        │
│  │  Descrição   │  │  Descrição   │  │  Descrição   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Serviço 4   │  │  Serviço 5   │  │  Serviço 6   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├──────────────────────────────────────────────────────────────┤
│  [COMO FUNCIONA] 🟣                                           │
│  Passo 1 → Passo 2 → Passo 3 → Passo 4                       │
│  (Timeline visual com ícones e descrições)                    │
├──────────────────────────────────────────────────────────────┤
│  [DEPOIMENTOS] 🟣                                             │
│  Slider/Grid com cards de depoimentos de clientes             │
├──────────────────────────────────────────────────────────────┤
│  [PLANOS / PREÇOS] 🟡                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  Básico  │  │  Pro ⭐  │  │ Enterprise│                    │
│  │ Preço    │  │ Preço    │  │ Preço    │                    │
│  │ Features │  │ Features │  │ Features │                    │
│  │ [Botão]  │  │ [Botão]  │  │ [Botão]  │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
├──────────────────────────────────────────────────────────────┤
│  [FAQ] 🟣                                                     │
│  Accordion com perguntas frequentes                           │
├──────────────────────────────────────────────────────────────┤
│  [CTA FINAL] 🟠                                               │
│  Headline + Sub + Botão de ação primária                      │
├──────────────────────────────────────────────────────────────┤
│  [FOOTER] 🟠                                                  │
│  Logo | Links | Redes Sociais | Copyright                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Identidade Visual e Design System

> **Referências:**
> - Protótipo: `C:\...\Protótipos\Responsive Landing Page Design v2.0`
> - Logos: `C:\...\Arquivos\Img\Logos\` (variações em .png)
> - Background: `C:\...\Arquivos\Img\BackGound.png`
> - Telas Figma: `C:\...\Arquivos\Telas\` (**seguir 1:1 obrigatoriamente**)

### ⚠️ REGRA CRÍTICA DE DESIGN
> Todas as telas devem seguir **exatamente** (1:1) a identidade visual definida no Figma. Qualquer desvio de cor, tipografia, espaçamento ou componente deve ser documentado e aprovado antes da implementação.

### Paleta de Cores (baseada no diagrama SVG)

```css
/* Cores Primárias do Sistema */
:root {
  /* Laranja — Ação, Header, Footer */
  --color-primary: #fc9432;
  --color-primary-dark: #e07820;
  --color-primary-light: #fdb870;

  /* Teal — Hero, Destaques */
  --color-secondary: #00c2a8;
  --color-secondary-dark: #009e88;
  --color-secondary-light: #33d4bd;

  /* Amarelo — Serviços, Cards de Destaque */
  --color-accent: #fcce14;
  --color-accent-dark: #e0b400;

  /* Roxo — Seções Informativas */
  --color-info: #e08fff;
  --color-info-dark: #c060e0;

  /* Azul — Componentes, Formulários, Links */
  --color-component: #1071e5;
  --color-component-light: #cfe4ff;

  /* Neutros */
  --color-dark: #1a1a2e;
  --color-gray-800: #2d3748;
  --color-gray-600: #4a5568;
  --color-gray-400: #a0aec0;
  --color-gray-100: #f7fafc;
  --color-white: #ffffff;
}
```

### Tipografia

```css
/* Fontes — a definir conforme protótipo Figma */
--font-heading: 'Poppins', sans-serif;   /* Títulos e headings */
--font-body: 'Inter', sans-serif;        /* Corpo de texto */
--font-mono: 'JetBrains Mono', monospace; /* Código (se necessário) */

/* Escala tipográfica */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### Variações de Logo

```
Logos disponíveis em: /public/images/logos/

Variações esperadas:
├── logo-principal.png          → Versão completa colorida
├── logo-branco.png             → Versão branca (para fundos escuros)
├── logo-escuro.png             → Versão escura (para fundos claros)
├── logo-icone.png              → Apenas o símbolo/ícone
├── logo-icone-branco.png       → Símbolo branco
└── favicon.png / favicon.ico   → Favicon 32x32 e 64x64
```

### Uso do Background

```
Background: /public/images/background.png
Aplicação:
- Hero Section: background-image com overlay semi-transparente
- Seções de CTA: background com blend mode
- Deve manter boa legibilidade sobre o texto
- Em mobile: background-size: cover; background-position: center;
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './app/Filament/**/*.php',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fc9432',
          dark: '#e07820',
          light: '#fdb870',
        },
        secondary: {
          DEFAULT: '#00c2a8',
          dark: '#009e88',
          light: '#33d4bd',
        },
        accent: '#fcce14',
        info: '#e08fff',
        component: {
          DEFAULT: '#1071e5',
          light: '#cfe4ff',
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero': "url('/images/background.png')",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 8. Páginas e Componentes Detalhados

### 8.1 — Layout Principal da Landing Page

**Arquivo:** `resources/views/layouts/landing.blade.php`

```blade
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{ $metaDescription ?? config('predialfix.meta_description') }}">
    <title>{{ $title ?? 'PredialFix — Gestão de Manutenção Predial' }}</title>

    {{-- Favicon --}}
    <link rel="icon" type="image/png" href="{{ asset('images/logos/favicon.png') }}">

    {{-- Preload de fontes --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

    {{-- Vite Assets --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    {{-- Alpine.js --}}
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

    @stack('head')
</head>
<body class="font-body text-gray-800 antialiased">
    <x-navbar />

    <main>
        {{ $slot }}
    </main>

    <x-footer />

    {{-- Modal de Contato Global --}}
    <x-modal-contato />

    @stack('scripts')
</body>
</html>
```

---

### 8.2 — Navbar

**Arquivo:** `resources/views/components/navbar.blade.php`

**Comportamento:**
- Posição: `fixed top-0` com `z-50`
- Estado inicial: transparente sobre o hero
- Após scroll (>80px): fundo branco com sombra suave (`shadow-md`)
- Mobile: hambúrguer com menu dropdown animado (Alpine.js)
- Logo: variação branca sobre hero, escura após scroll

```blade
<nav x-data="{ open: false, scrolled: false }"
     @scroll.window="scrolled = window.scrollY > 80"
     :class="scrolled ? 'bg-white shadow-md' : 'bg-transparent'"
     class="fixed top-0 w-full z-50 transition-all duration-300">

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">

            {{-- Logo --}}
            <a href="{{ route('landing') }}" class="flex-shrink-0">
                <img :src="scrolled
                        ? '{{ asset('images/logos/logo-escuro.png') }}'
                        : '{{ asset('images/logos/logo-branco.png') }}'"
                     alt="PredialFix"
                     class="h-10 w-auto transition-all duration-300">
            </a>

            {{-- Menu Desktop --}}
            <div class="hidden md:flex items-center space-x-8">
                <a href="#inicio" class="nav-link">Início</a>
                <a href="#servicos" class="nav-link">Serviços</a>
                <a href="#como-funciona" class="nav-link">Como Funciona</a>
                <a href="#planos" class="nav-link">Planos</a>
                <a href="#contato" class="nav-link">Contato</a>
            </div>

            {{-- CTAs --}}
            <div class="hidden md:flex items-center space-x-3">
                @auth
                    <a href="{{ url('/dashboard') }}" class="btn-secondary">
                        Meu Painel
                    </a>
                @else
                    <a href="{{ route('login') }}" class="nav-link">Entrar</a>
                    <a href="#contato" class="btn-primary">
                        Solicitar Orçamento
                    </a>
                @endauth
            </div>

            {{-- Hamburguer Mobile --}}
            <button @click="open = !open"
                    class="md:hidden p-2 rounded-md"
                    aria-label="Menu">
                {{-- Ícone hambúrguer --}}
            </button>
        </div>
    </div>

    {{-- Menu Mobile --}}
    <div x-show="open"
         x-transition:enter="transition ease-out duration-200"
         x-transition:leave="transition ease-in duration-150"
         class="md:hidden bg-white shadow-lg border-t border-gray-100">
        {{-- Links mobile --}}
    </div>
</nav>
```

**Classes CSS customizadas (`app.css`):**

```css
.nav-link {
  @apply text-sm font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-primary text-white px-5 py-2.5 rounded-lg font-semibold
         text-sm transition-all duration-200 hover:bg-primary-dark
         hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0;
}

.btn-secondary {
  @apply border-2 border-primary text-primary px-5 py-2.5 rounded-lg
         font-semibold text-sm transition-all duration-200
         hover:bg-primary hover:text-white;
}
```

---

### 8.3 — Hero Section

**Arquivo:** `resources/views/landing/partials/hero.blade.php`

**Especificações:**
- Altura: `min-h-screen` (100vh)
- Background: `BackGound.png` com overlay escuro gradient
- Layout: 2 colunas em desktop (texto esquerda, formulário direita), 1 coluna mobile
- Padding top: `pt-20` (compensar navbar fixa)
- Animações de entrada: fade-up com Alpine.js e CSS transitions

```blade
<section id="inicio"
         class="relative min-h-screen flex items-center bg-hero bg-cover bg-center pt-20"
         x-data="{ visible: false }"
         x-init="setTimeout(() => visible = true, 100)">

    {{-- Overlay gradiente --}}
    <div class="absolute inset-0 bg-gradient-to-r from-dark/85 via-dark/70 to-dark/40"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {{-- Coluna de Texto --}}
            <div x-show="visible"
                 x-transition:enter="transition ease-out duration-700"
                 x-transition:enter-start="opacity-0 -translate-x-8"
                 x-transition:enter-end="opacity-100 translate-x-0">

                {{-- Badge/Eyebrow --}}
                <span class="inline-flex items-center gap-2 bg-secondary/20 text-secondary
                             border border-secondary/30 rounded-full px-4 py-1.5 text-sm
                             font-medium mb-6">
                    <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Manutenção Predial Senai
                </span>

                <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold
                           text-white leading-tight mb-6">
                    Manutenção predial
                    <span class="text-primary">simplificada</span>
                    e eficiente
                </h1>

                <p class="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                    Gerencie todos os chamados de manutenção da sua unidade Senai
                    em um só lugar. Transparência, agilidade e controle total.
                </p>

                {{-- Stats rápidos --}}
                <div class="flex gap-8 mb-8">
                    <div>
                        <p class="text-3xl font-bold text-white font-heading">+50</p>
                        <p class="text-gray-400 text-sm">Unidades Senai</p>
                    </div>
                    <div class="border-l border-white/20 pl-8">
                        <p class="text-3xl font-bold text-white font-heading">98%</p>
                        <p class="text-gray-400 text-sm">Satisfação</p>
                    </div>
                    <div class="border-l border-white/20 pl-8">
                        <p class="text-3xl font-bold text-white font-heading">24h</p>
                        <p class="text-gray-400 text-sm">Tempo médio</p>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3">
                    <a href="#contato" class="btn-primary text-base px-8 py-3">
                        Solicitar Demonstração
                    </a>
                    <a href="#como-funciona"
                       class="flex items-center gap-2 text-white border border-white/30
                              px-8 py-3 rounded-lg hover:border-white transition-colors">
                        Ver como funciona
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </a>
                </div>
            </div>

            {{-- Formulário de Lead --}}
            <div x-show="visible"
                 x-transition:enter="transition ease-out duration-700 delay-200"
                 x-transition:enter-start="opacity-0 translate-x-8"
                 x-transition:enter-end="opacity-100 translate-x-0"
                 class="bg-white rounded-2xl shadow-2xl p-8">

                <h3 class="font-heading text-2xl font-bold text-gray-900 mb-2">
                    Solicite um orçamento
                </h3>
                <p class="text-gray-500 text-sm mb-6">
                    Preencha e entraremos em contato em até 1h útil.
                </p>

                <form action="{{ route('lead.store') }}" method="POST"
                      x-data="leadForm()" @submit.prevent="submitForm">
                    @csrf

                    {{-- Nome --}}
                    <div class="mb-4">
                        <label class="form-label">Nome completo *</label>
                        <input type="text" name="nome" x-model="form.nome"
                               class="form-input" placeholder="João Silva" required>
                        <p x-show="errors.nome" x-text="errors.nome"
                           class="form-error"></p>
                    </div>

                    {{-- E-mail --}}
                    <div class="mb-4">
                        <label class="form-label">E-mail *</label>
                        <input type="email" name="email" x-model="form.email"
                               class="form-input" placeholder="joao@email.com" required>
                    </div>

                    {{-- Telefone --}}
                    <div class="mb-4">
                        <label class="form-label">WhatsApp *</label>
                        <input type="tel" name="telefone" x-model="form.telefone"
                               class="form-input" placeholder="(11) 99999-9999"
                               x-mask="(99) 99999-9999" required>
                    </div>

                    {{-- Tipo de imóvel --}}
                    <div class="mb-6">
                        <label class="form-label">Tipo de imóvel</label>
                        <select name="tipo_imovel" x-model="form.tipo_imovel"
                                class="form-input">
                            <option value="">Selecione...</option>
                            <option value="residencial">Residencial</option>
                            <option value="comercial">Comercial</option>
                            <option value="industrial">Industrial</option>
                            <option value="condominio">Condomínio</option>
                        </select>
                    </div>

                    <button type="submit"
                            :disabled="loading"
                            class="btn-primary w-full py-3 text-base justify-center
                                   flex items-center gap-2">
                        <span x-show="!loading">Solicitar Orçamento Grátis</span>
                        <span x-show="loading">Enviando...</span>
                    </button>

                    <p class="text-xs text-gray-400 text-center mt-3">
                        🔒 Seus dados estão seguros. Sem spam.
                    </p>
                </form>
            </div>

        </div>
    </div>

    {{-- Scroll indicator --}}
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
    </div>
</section>
```

---

### 8.4 — Seção Sobre / Diferenciais

**Arquivo:** `resources/views/landing/partials/sobre.blade.php`

**Layout:** Grid de 4 cards de diferenciais com ícone, título e descrição

```blade
<section id="sobre" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {{-- Cabeçalho --}}
        <div class="text-center mb-16" x-data x-intersect="$el.classList.add('animate-fade-up')">
            <span class="text-secondary font-semibold text-sm uppercase tracking-widest">
                Por que nos escolher
            </span>
            <h2 class="section-title mt-2">
                Diferenciais que fazem a diferença
            </h2>
            <p class="section-subtitle">
                Uma plataforma completa para resolver os desafios da gestão predial
            </p>
        </div>

        {{-- Grid de Cards --}}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            @foreach ($diferenciais as $item)
                <x-card-diferencial :item="$item" />
            @endforeach
        </div>
    </div>
</section>
```

**Diferenciais (definidos no Controller ou config):**

```php
// Em LandingController@index
$diferenciais = [
    [
        'icone' => 'heroicon-o-bolt',
        'cor' => 'primary',
        'titulo' => 'Resposta Rápida',
        'descricao' => 'Chamados atendidos em até 24 horas com equipe especializada.',
    ],
    [
        'icone' => 'heroicon-o-shield-check',
        'cor' => 'secondary',
        'titulo' => 'Garantia de Qualidade',
        'descricao' => 'Todos os serviços com garantia e profissionais certificados.',
    ],
    [
        'icone' => 'heroicon-o-chart-bar',
        'cor' => 'accent',
        'titulo' => 'Gestão Transparente',
        'descricao' => 'Acompanhe cada etapa do serviço em tempo real.',
    ],
    [
        'icone' => 'heroicon-o-currency-dollar',
        'cor' => 'info',
        'titulo' => 'Melhor Custo-Benefício',
        'descricao' => 'Preços competitivos com qualidade premium garantida.',
    ],
];
```

---

### 8.5 — Seção de Serviços

**Arquivo:** `resources/views/landing/partials/servicos.blade.php`

**Layout:** Grid de 6 cards (3 colunas desktop, 2 tablet, 1 mobile)

```blade
<section id="servicos" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-16">
            <span class="text-primary font-semibold text-sm uppercase tracking-widest">
                O que fazemos
            </span>
            <h2 class="section-title mt-2">Nossos Serviços</h2>
            <p class="section-subtitle">
                Soluções completas para manutenção e conservação predial
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @foreach ($servicos as $servico)
                <x-card-servico :servico="$servico" />
            @endforeach
        </div>

        <div class="text-center mt-12">
            <a href="#contato" class="btn-primary text-base px-8 py-3">
                Ver todos os serviços
            </a>
        </div>
    </div>
</section>
```

**Categorias de Serviços:**

```php
$servicos = [
    ['titulo' => 'Hidráulica', 'icone' => '🔧', 'descricao' => '...'],
    ['titulo' => 'Elétrica', 'icone' => '⚡', 'descricao' => '...'],
    ['titulo' => 'Pintura', 'icone' => '🎨', 'descricao' => '...'],
    ['titulo' => 'Alvenaria', 'icone' => '🧱', 'descricao' => '...'],
    ['titulo' => 'Jardinagem', 'icone' => '🌿', 'descricao' => '...'],
    ['titulo' => 'Limpeza', 'icone' => '✨', 'descricao' => '...'],
];
```

---

### 8.6 — Seção Como Funciona

**Arquivo:** `resources/views/landing/partials/como-funciona.blade.php`

**Layout:** Timeline horizontal (desktop) / vertical (mobile) com 4 passos

```blade
<section id="como-funciona" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
            <span class="text-secondary font-semibold text-sm uppercase tracking-widest">
                Processo simples
            </span>
            <h2 class="section-title mt-2">Como Funciona</h2>
        </div>

        {{-- Timeline --}}
        <div class="relative">
            {{-- Linha conectora (desktop) --}}
            <div class="hidden lg:block absolute top-12 left-1/8 right-1/8
                        h-0.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                @foreach ($passos as $index => $passo)
                    <div class="relative flex flex-col items-center text-center">
                        {{-- Número do passo --}}
                        <div class="w-24 h-24 rounded-full bg-white shadow-lg border-4
                                    border-primary flex items-center justify-center mb-6
                                    relative z-10">
                            <span class="text-3xl font-bold font-heading text-primary">
                                {{ $index + 1 }}
                            </span>
                        </div>
                        <h3 class="font-heading text-xl font-semibold mb-3">
                            {{ $passo['titulo'] }}
                        </h3>
                        <p class="text-gray-600 leading-relaxed">
                            {{ $passo['descricao'] }}
                        </p>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
```

**4 Passos:**
1. **Cadastre-se** — Crie sua conta em menos de 2 minutos
2. **Abra um Chamado** — Descreva o problema e adicione fotos
3. **Acompanhe** — Receba atualizações em tempo real por WhatsApp
4. **Avalie** — Dê sua nota e ajude a melhorar o serviço

---

### 8.7 — Seção de Depoimentos

**Arquivo:** `resources/views/landing/partials/depoimentos.blade.php`

**Layout:** Slider com autoplay (Alpine.js) ou grid estático de 3 cards

```blade
<section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
            <h2 class="section-title">O que dizem nossos clientes</h2>
        </div>

        <div x-data="slider()" class="relative overflow-hidden">
            {{-- Slides --}}
            <div class="flex transition-transform duration-500 ease-out"
                 :style="'transform: translateX(-' + (current * 100) + '%)'">
                @foreach ($depoimentos as $depoimento)
                    <x-card-depoimento :depoimento="$depoimento" class="w-full flex-shrink-0" />
                @endforeach
            </div>

            {{-- Dots --}}
            <div class="flex justify-center gap-2 mt-8">
                @foreach ($depoimentos as $i => $d)
                    <button @click="current = {{ $i }}"
                            :class="current === {{ $i }} ? 'bg-primary' : 'bg-gray-300'"
                            class="w-3 h-3 rounded-full transition-colors"></button>
                @endforeach
            </div>
        </div>
    </div>
</section>
```

---

### 8.8 — Seção de Planos

**Arquivo:** `resources/views/landing/partials/planos.blade.php`

**Layout:** 3 cards de planos, com o central destacado (popular)

```blade
<section id="planos" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div class="text-center mb-16">
            <h2 class="section-title">Planos e Preços</h2>
            <p class="section-subtitle">Escolha o plano ideal para sua unidade Senai</p>

            {{-- Toggle Mensal/Anual --}}
            <div x-data="{ anual: false }" class="flex items-center justify-center gap-3 mt-6">
                <span :class="!anual && 'font-semibold'">Mensal</span>
                <button @click="anual = !anual"
                        class="relative w-12 h-6 rounded-full transition-colors"
                        :class="anual ? 'bg-primary' : 'bg-gray-300'">
                    <span class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white
                                 transition-transform"
                          :class="anual ? 'translate-x-6' : ''"></span>
                </button>
                <span :class="anual && 'font-semibold'">
                    Anual <span class="text-secondary text-sm font-medium">(20% off)</span>
                </span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {{-- Plano Básico --}}
            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 class="font-heading text-xl font-bold mb-2">Básico</h3>
                <p class="text-gray-500 text-sm mb-6">Ideal para unidades de menor porte</p>
                <div class="mb-6">
                    <span class="text-4xl font-bold font-heading">R$ 149</span>
                    <span class="text-gray-500">/mês</span>
                </div>
                {{-- Features list --}}
                {{-- CTA --}}
                <a href="#contato" class="btn-secondary w-full text-center block py-3 rounded-lg">
                    Começar Grátis
                </a>
            </div>

            {{-- Plano Pro (Destaque) --}}
            <div class="bg-primary rounded-2xl p-8 shadow-xl scale-105 relative">
                <span class="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-dark
                             px-4 py-1 rounded-full text-sm font-bold">
                    ⭐ Mais Popular
                </span>
                {{-- ... --}}
                <a href="#contato" class="bg-white text-primary w-full text-center block py-3
                                         rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Escolher Pro
                </a>
            </div>

            {{-- Plano Enterprise --}}
            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                {{-- ... --}}
            </div>
        </div>
    </div>
</section>
```

---

### 8.9 — FAQ

**Arquivo:** `resources/views/landing/partials/faq.blade.php`

**Layout:** Accordion com Alpine.js, máximo 8 perguntas

```blade
<section class="py-20 bg-white">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
            <h2 class="section-title">Perguntas Frequentes</h2>
        </div>

        <div class="space-y-4">
            @foreach ($faqs as $i => $faq)
                <div x-data="{ open: {{ $i === 0 ? 'true' : 'false' }} }"
                     class="border border-gray-200 rounded-xl overflow-hidden">

                    <button @click="open = !open"
                            class="w-full flex justify-between items-center px-6 py-5
                                   text-left font-medium hover:bg-gray-50 transition-colors">
                        <span>{{ $faq['pergunta'] }}</span>
                        <svg class="w-5 h-5 transition-transform duration-200 text-primary flex-shrink-0"
                             :class="open && 'rotate-180'"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>

                    <div x-show="open"
                         x-collapse
                         class="px-6 pb-5 text-gray-600 leading-relaxed">
                        {{ $faq['resposta'] }}
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</section>
```

---

### 8.10 — CTA Final

**Arquivo:** `resources/views/landing/partials/cta.blade.php`

```blade
<section class="py-24 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
    {{-- Elementos decorativos --}}
    <div class="absolute inset-0 opacity-10">
        {{-- Pattern ou SVG decorativo --}}
    </div>

    <div class="relative max-w-4xl mx-auto px-4 text-center">
        <h2 class="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar a gestão da sua unidade Senai?
        </h2>
        <p class="text-white/80 text-xl mb-10 max-w-2xl mx-auto">
            Junte-se às unidades Senai que já confiam na PredialFix.
            Comece hoje com 30 dias grátis.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
            <a href="#contato"
               class="bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg
                      hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                Começar Agora — É Grátis
            </a>
            <a href="tel:+5511999999999"
               class="border-2 border-white text-white px-10 py-4 rounded-xl font-bold
                      text-lg hover:bg-white hover:text-primary transition-all duration-200">
                Falar com Especialista
            </a>
        </div>
    </div>
</section>
```

---

### 8.11 — Footer

**Arquivo:** `resources/views/components/footer.blade.php`

**Layout:** 4 colunas (Logo+Descrição | Links | Serviços | Contato) + barra de copyright

```blade
<footer class="bg-dark text-gray-400">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {{-- Col 1: Logo + Descrição --}}
            <div>
                <img src="{{ asset('images/logos/logo-branco.png') }}"
                     alt="PredialFix" class="h-10 mb-4">
                <p class="text-sm leading-relaxed text-gray-500">
                    Plataforma completa para gestão de manutenção predial de unidades Senai.
                    Transparência e eficiência para gestores e colaboradores.
                </p>
                <div class="flex gap-3 mt-6">
                    {{-- Links redes sociais com ícones --}}
                </div>
            </div>

            {{-- Col 2: Links Rápidos --}}
            <div>
                <h4 class="text-white font-semibold mb-4">Links Rápidos</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="#inicio" class="hover:text-primary transition-colors">Início</a></li>
                    <li><a href="#servicos" class="hover:text-primary transition-colors">Serviços</a></li>
                    <li><a href="#como-funciona" class="hover:text-primary transition-colors">Como Funciona</a></li>
                    <li><a href="#planos" class="hover:text-primary transition-colors">Planos</a></li>
                </ul>
            </div>

            {{-- Col 3: Serviços --}}
            <div>
                <h4 class="text-white font-semibold mb-4">Serviços</h4>
                <ul class="space-y-2 text-sm">
                    <li><a href="#" class="hover:text-primary transition-colors">Hidráulica</a></li>
                    <li><a href="#" class="hover:text-primary transition-colors">Elétrica</a></li>
                    <li><a href="#" class="hover:text-primary transition-colors">Pintura</a></li>
                    <li><a href="#" class="hover:text-primary transition-colors">Alvenaria</a></li>
                </ul>
            </div>

            {{-- Col 4: Contato --}}
            <div>
                <h4 class="text-white font-semibold mb-4">Contato</h4>
                <ul class="space-y-3 text-sm">
                    <li class="flex items-center gap-2">
                        📍 São Paulo, SP
                    </li>
                    <li class="flex items-center gap-2">
                        📞 <a href="tel:+5511999999999" class="hover:text-primary">
                            (11) 99999-9999
                        </a>
                    </li>
                    <li class="flex items-center gap-2">
                        ✉️ <a href="mailto:contato@predialfix.com.br" class="hover:text-primary">
                            contato@predialfix.com.br
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>

    {{-- Barra de copyright --}}
    <div class="border-t border-white/10">
        <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between
                    items-center gap-4 text-sm text-gray-600">
            <p>© {{ date('Y') }} PredialFix. Todos os direitos reservados.</p>
            <div class="flex gap-6">
                <a href="/politica-privacidade" class="hover:text-primary transition-colors">
                    Política de Privacidade
                </a>
                <a href="/termos-de-uso" class="hover:text-primary transition-colors">
                    Termos de Uso
                </a>
            </div>
        </div>
    </div>
</footer>
```

---

## 9. Sistema de Autenticação (Breeze)

### Instalação e Configuração

```bash
# Instalar Breeze com Blade
composer require laravel/breeze --dev
php artisan breeze:install blade

# Compilar assets
npm install && npm run dev

# Rodar migrações
php artisan migrate
```

### Customizações Necessárias

**1. Adicionar campos extras ao registro:**

```php
// database/migrations/[timestamp]_add_fields_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->string('telefone')->nullable();
    $table->string('tipo')->default('colaborador'); // colaborador, gestor_unidade, prestador
    $table->foreignId('unidade_id')->nullable()->constrained()->nullOnDelete();
    $table->string('cpf')->nullable()->unique();
    $table->string('avatar')->nullable();
    $table->boolean('ativo')->default(true);
    $table->timestamp('last_login_at')->nullable();
});
```

**2. Customizar views do Breeze para seguir a identidade visual:**

```
resources/views/auth/
├── login.blade.php          → Usar layout da landing, não o padrão Breeze
├── register.blade.php       → Mesmo layout
├── forgot-password.blade.php
├── reset-password.blade.php
└── verify-email.blade.php
```

**3. Redirecionar por role após login:**

```php
// app/Http/Controllers/Auth/AuthenticatedSessionController.php
protected function authenticated(Request $request, $user): string
{
    return match($user->tipo) {
        'super_admin', 'admin' => '/admin',  // Filament
        default => '/dashboard',              // Portal do usuário
    };
}
```

### Guards e Middleware

```php
// routes/web.php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
         ->name('dashboard');

    Route::middleware(['role:gestor_unidade,admin'])->group(function () {
        Route::resource('/chamados', ChamadoController::class);
    });
});
```

---

## 10. Painel Administrativo (Filament)

### Instalação

```bash
composer require filament/filament:"^3.2" -W
php artisan filament:install --panels
```

### Configuração do Panel

```php
// app/Providers/Filament/AdminPanelProvider.php
public function panel(Panel $panel): Panel
{
    return $panel
        ->id('admin')
        ->path('admin')
        ->login()
        ->colors([
            'primary' => Color::hex('#fc9432'),
            'secondary' => Color::hex('#00c2a8'),
        ])
        ->font('Poppins')
        ->brandName('PredialFix Admin')
        ->brandLogo(asset('images/logos/logo-escuro.png'))
        ->favicon(asset('images/logos/favicon.png'))
        ->navigationGroups([
            NavigationGroup::make('Gestão')
                ->icon('heroicon-o-building-office-2'),
            NavigationGroup::make('Usuários')
                ->icon('heroicon-o-users'),
            NavigationGroup::make('Configurações')
                ->icon('heroicon-o-cog-6-tooth'),
        ])
        ->resources([
            UserResource::class,
            UnidadeResource::class,
            ChamadoResource::class,
            ServicoResource::class,
            LeadResource::class,
            CategoriaResource::class,
        ])
        ->pages([
            Pages\Dashboard::class,
        ])
        ->widgets([
            Widgets\AccountWidget::class,
            Widgets\StatsOverview::class,
            Widgets\ChamadosChart::class,
            Widgets\AtividadesRecentes::class,
        ]);
}
```

### Resources do Filament

#### UserResource

```php
// app/Filament/Resources/UserResource.php
class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationGroup = 'Usuários';
    protected static ?string $modelLabel = 'Usuário';
    protected static ?string $pluralModelLabel = 'Usuários';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Dados Pessoais')
                ->schema([
                    Forms\Components\TextInput::make('name')->required(),
                    Forms\Components\TextInput::make('email')->email()->required()->unique(),
                    Forms\Components\TextInput::make('telefone')
                        ->mask('(99) 99999-9999'),
                    Forms\Components\Select::make('tipo')
                        ->options([
                            'colaborador' => 'Colaborador',
                            'gestor_unidade' => 'Gestor de Unidade',
                            'prestador' => 'Prestador',
                            'admin' => 'Administrador',
                        ])->required(),
                    Forms\Components\Select::make('unidade_id')
                        ->relationship('unidade', 'nome')
                        ->searchable()
                        ->preload(),
                    Forms\Components\Toggle::make('ativo')->default(true),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar')->circular(),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\BadgeColumn::make('tipo')
                    ->colors([
                        'primary' => 'admin',
                        'success' => 'gestor_unidade',
                        'warning' => 'prestador',
                        'secondary' => 'colaborador',
                    ]),
                Tables\Columns\IconColumn::make('ativo')->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('d/m/Y')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('tipo'),
                Tables\Filters\TernaryFilter::make('ativo'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }
}
```

#### ChamadoResource

```php
// app/Filament/Resources/ChamadoResource.php
class ChamadoResource extends Resource
{
    protected static ?string $model = Chamado::class;
    protected static ?string $navigationIcon = 'heroicon-o-wrench-screwdriver';
    protected static ?string $navigationGroup = 'Gestão';
    protected static ?string $modelLabel = 'Chamado';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Informações do Chamado')
                ->schema([
                    Forms\Components\TextInput::make('titulo')->required()->maxLength(255),
                    Forms\Components\Textarea::make('descricao')->required()->rows(4),
                    Forms\Components\Select::make('categoria_id')
                        ->relationship('categoria', 'nome')->required(),
                    Forms\Components\Select::make('prioridade')
                        ->options([
                            'baixa' => 'Baixa',
                            'media' => 'Média',
                            'alta' => 'Alta',
                            'urgente' => 'Urgente',
                        ])->required(),
                    Forms\Components\Select::make('status')
                        ->options([
                            'aberto' => 'Aberto',
                            'em_andamento' => 'Em Andamento',
                            'aguardando' => 'Aguardando Peças',
                            'concluido' => 'Concluído',
                            'cancelado' => 'Cancelado',
                        ])->default('aberto'),
                    Forms\Components\Select::make('prestador_id')
                        ->relationship('prestador', 'name')
                        ->searchable(),
                ])->columns(2),

            Forms\Components\Section::make('Mídias')
                ->schema([
                    Forms\Components\SpatieMediaLibraryFileUpload::make('fotos')
                        ->multiple()
                        ->image()
                        ->maxFiles(10)
                        ->collection('fotos-chamado'),
                ]),
        ]);
    }
}
```

### Dashboard Widgets

```php
// app/Filament/Widgets/StatsOverview.php
class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Chamados Abertos', Chamado::where('status', 'aberto')->count())
                ->description('Aguardando atendimento')
                ->color('warning')
                ->icon('heroicon-o-clock'),

            Stat::make('Chamados Concluídos', Chamado::where('status', 'concluido')
                ->whereMonth('updated_at', now()->month)->count())
                ->description('Este mês')
                ->color('success')
                ->icon('heroicon-o-check-circle'),

            Stat::make('Total de Leads', Lead::count())
                ->description(Lead::whereDate('created_at', today())->count() . ' hoje')
                ->color('primary')
                ->icon('heroicon-o-user-plus'),

            Stat::make('Unidades Ativas', Unidade::where('ativo', true)->count())
                ->color('info')
                ->icon('heroicon-o-building-office-2'),
        ];
    }
}
```

---

## 11. Models e Banco de Dados

### Schema Completo

#### Migration: users (extensão do Breeze)

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('telefone')->nullable();
    $table->string('cpf', 14)->nullable()->unique();
    $table->string('tipo')->default('colaborador');
    $table->string('avatar')->nullable();
    $table->boolean('ativo')->default(true);
    $table->foreignId('unidade_id')->nullable()->constrained()->nullOnDelete();
    $table->timestamp('email_verified_at')->nullable();
    $table->timestamp('last_login_at')->nullable();
    $table->string('password');
    $table->rememberToken();
    $table->timestamps();
    $table->softDeletes();
});
```

#### Migration: unidades

```php
Schema::create('unidades', function (Blueprint $table) {
    $table->id();
    $table->string('nome');
    $table->string('cnpj', 18)->nullable()->unique();
    $table->string('endereco');
    $table->string('cidade');
    $table->string('estado', 2);
    $table->string('cep', 9);
    $table->integer('total_colaboradores')->default(0);
    $table->string('logo')->nullable();
    $table->boolean('ativo')->default(true);
    $table->json('configuracoes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

#### Migration: categorias

```php
Schema::create('categorias', function (Blueprint $table) {
    $table->id();
    $table->string('nome');
    $table->string('slug')->unique();
    $table->string('icone')->nullable();
    $table->string('cor', 7)->default('#fc9432');
    $table->text('descricao')->nullable();
    $table->boolean('ativo')->default(true);
    $table->integer('ordem')->default(0);
    $table->timestamps();
});
```

#### Migration: chamados

```php
Schema::create('chamados', function (Blueprint $table) {
    $table->id();
    $table->string('titulo');
    $table->text('descricao');
    $table->string('numero')->unique(); // ex: PF-2026-00001
    $table->string('status')->default('aberto');
    // aberto | em_andamento | aguardando_pecas | concluido | cancelado
    $table->string('prioridade')->default('media');
    // baixa | media | alta | urgente
    $table->foreignId('categoria_id')->constrained();
    $table->foreignId('unidade_id')->constrained();
    $table->foreignId('solicitante_id')->constrained('users');
    $table->foreignId('prestador_id')->nullable()->constrained('users')->nullOnDelete();
    $table->text('observacoes')->nullable();
    $table->text('resolucao')->nullable();
    $table->decimal('custo', 10, 2)->nullable();
    $table->timestamp('agendado_para')->nullable();
    $table->timestamp('iniciado_em')->nullable();
    $table->timestamp('concluido_em')->nullable();
    $table->timestamps();
    $table->softDeletes();
});
```

#### Migration: leads

```php
Schema::create('leads', function (Blueprint $table) {
    $table->id();
    $table->string('nome');
    $table->string('email');
    $table->string('telefone');
    $table->string('tipo_imovel')->nullable();
    $table->text('mensagem')->nullable();
    $table->string('origem')->default('landing_page');
    // landing_page | whatsapp | indicacao | google
    $table->string('status')->default('novo');
    // novo | contatado | qualificado | convertido | perdido
    $table->string('utm_source')->nullable();
    $table->string('utm_medium')->nullable();
    $table->string('utm_campaign')->nullable();
    $table->foreignId('responsavel_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamp('contatado_em')->nullable();
    $table->timestamps();
});
```

#### Migration: historico_chamados

```php
Schema::create('historico_chamados', function (Blueprint $table) {
    $table->id();
    $table->foreignId('chamado_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->string('status_anterior')->nullable();
    $table->string('status_novo');
    $table->text('observacao')->nullable();
    $table->timestamps();
});
```

### Models Eloquent

#### User Model

```php
// app/Models/User.php
class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    protected $fillable = [
        'name', 'email', 'password', 'telefone', 'cpf',
        'tipo', 'avatar', 'ativo', 'unidade_id', 'last_login_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'ativo' => 'boolean',
    ];

    // Relacionamentos
    public function unidade(): BelongsTo
    {
        return $this->belongsTo(Unidade::class);
    }

    public function chamadosAbertos(): HasMany
    {
        return $this->hasMany(Chamado::class, 'solicitante_id')
                    ->where('status', 'aberto');
    }

    // Filament: restringe acesso ao painel
    public function canAccessPanel(Panel $panel): bool
    {
        return in_array($this->tipo, ['admin', 'super_admin']);
    }

    // Scopes
    public function scopeAtivos($query) { return $query->where('ativo', true); }
    public function scopeTipo($query, string $tipo) { return $query->where('tipo', $tipo); }
}
```

#### Chamado Model

```php
// app/Models/Chamado.php
class Chamado extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'titulo', 'descricao', 'numero', 'status', 'prioridade',
        'categoria_id', 'unidade_id', 'solicitante_id', 'prestador_id',
        'observacoes', 'resolucao', 'custo', 'agendado_para',
        'iniciado_em', 'concluido_em',
    ];

    protected $casts = [
        'agendado_para' => 'datetime',
        'iniciado_em' => 'datetime',
        'concluido_em' => 'datetime',
        'custo' => 'decimal:2',
    ];

    // Boot: gera número sequencial
    protected static function booted(): void
    {
        static::creating(function (Chamado $chamado) {
            $ano = now()->year;
            $ultimo = static::whereYear('created_at', $ano)->count() + 1;
            $chamado->numero = "PF-{$ano}-" . str_pad($ultimo, 5, '0', STR_PAD_LEFT);
        });

        static::updating(function (Chamado $chamado) {
            if ($chamado->isDirty('status')) {
                HistoricoChamado::create([
                    'chamado_id' => $chamado->id,
                    'user_id' => auth()->id(),
                    'status_anterior' => $chamado->getOriginal('status'),
                    'status_novo' => $chamado->status,
                ]);
            }
        });
    }

    // Relacionamentos
    public function categoria(): BelongsTo { return $this->belongsTo(Categoria::class); }
    public function unidade(): BelongsTo { return $this->belongsTo(Unidade::class); }
    public function solicitante(): BelongsTo { return $this->belongsTo(User::class, 'solicitante_id'); }
    public function prestador(): BelongsTo { return $this->belongsTo(User::class, 'prestador_id'); }
    public function historico(): HasMany { return $this->hasMany(HistoricoChamado::class); }

    // ...
    public function scopeAbertos($q) { return $q->where('status', 'aberto'); }
    public function scopePorUnidade($q, $id) { return $q->where('unidade_id', $id); }
    public function getStatusBadgeColorAttribute(): string
    {
        return match($this->status) {
            'aberto' => 'blue',
            'em_andamento' => 'yellow',
            'aguardando_pecas' => 'orange',
            'concluido' => 'green',
            'cancelado' => 'red',
            default => 'gray',
        };
    }
}
```

---

## 12. Rotas e Controllers

### web.php

```php
// routes/web.php
use App\Http\Controllers\{LandingController, ContatoController, ChamadoController};

// ============================================
// ROTAS PÚBLICAS — Landing Page
// ============================================
Route::get('/', [LandingController::class, 'index'])->name('landing');

// Lead/Contato
Route::post('/lead', [ContatoController::class, 'storeLead'])->name('lead.store');
Route::post('/contato', [ContatoController::class, 'storeContato'])->name('contato.store');

// Páginas estáticas
Route::view('/politica-privacidade', 'pages.politica-privacidade')->name('politica');
Route::view('/termos-de-uso', 'pages.termos')->name('termos');

// ============================================
// ROTAS AUTENTICADAS — Portal do Usuário
// ============================================
Route::middleware(['auth', 'verified'])->prefix('portal')->name('portal.')->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Chamados
    Route::resource('chamados', ChamadoController::class)->except(['destroy']);
    Route::patch('chamados/{chamado}/status', [ChamadoController::class, 'updateStatus'])
         ->name('chamados.status');

    // Perfil
    Route::get('perfil', [PerfilController::class, 'show'])->name('perfil');
    Route::put('perfil', [PerfilController::class, 'update'])->name('perfil.update');
});

// ============================================
// AUTH ROUTES — Breeze
// ============================================
require __DIR__.'/auth.php';
```

### LandingController

```php
// app/Http/Controllers/LandingController.php
class LandingController extends Controller
{
    public function index(): View
    {
        $servicos = Categoria::where('ativo', true)
                             ->orderBy('ordem')
                             ->get();

        $depoimentos = [
            ['nome' => 'Maria Silva', 'cargo' => 'Síndica', 'texto' => '...', 'avaliacao' => 5],
            // ...
        ];

        $faqs = [
            ['pergunta' => 'Como funciona o sistema?', 'resposta' => '...'],
            // ...
        ];

        $passos = [
            ['titulo' => 'Cadastre-se', 'descricao' => '...'],
            ['titulo' => 'Abra um Chamado', 'descricao' => '...'],
            ['titulo' => 'Acompanhe', 'descricao' => '...'],
            ['titulo' => 'Avalie', 'descricao' => '...'],
        ];

        return view('landing.index', compact('servicos', 'depoimentos', 'faqs', 'passos'));
    }
}
```

### ContatoController

```php
// app/Http/Controllers/ContatoController.php
class ContatoController extends Controller
{
    public function storeLead(ContatoRequest $request): JsonResponse
    {
        $lead = Lead::create([
            ...$request->validated(),
            'utm_source' => $request->cookie('utm_source'),
            'utm_medium' => $request->cookie('utm_medium'),
            'utm_campaign' => $request->cookie('utm_campaign'),
            'origem' => 'landing_page',
        ]);

        // Notificação interna
        Notification::route('mail', config('predialfix.email_leads'))
                    ->notify(new NovoLeadNotification($lead));

        // Resposta ao lead (e-mail de confirmação)
        Mail::to($lead->email)->queue(new LeadConfirmacaoMail($lead));

        return response()->json([
            'success' => true,
            'message' => 'Recebemos seu contato! Entraremos em breve.',
        ]);
    }
}
```

---

## 13. Componentes Blade

### Estrutura de Componentes Reutilizáveis

```
resources/views/components/
├── navbar.blade.php             → Navegação principal
├── footer.blade.php             → Rodapé
├── logo.blade.php               → Componente de logo
├── btn-primary.blade.php        → Botão primário
├── btn-secondary.blade.php      → Botão secundário
├── section-header.blade.php     → Cabeçalho de seção (tag + título + sub)
├── card-diferencial.blade.php   → Card de diferencial/feature
├── card-servico.blade.php       → Card de serviço
├── card-depoimento.blade.php    → Card de depoimento
├── card-plano.blade.php         → Card de plano/preço
├── modal-contato.blade.php      → Modal do formulário de contato
├── badge-status.blade.php       → Badge de status de chamado
└── alert.blade.php              → Componente de alertas/notificações
```

### section-header.blade.php

```blade
@props(['tag' => '', 'titulo', 'subtitulo' => '', 'cor' => 'primary', 'alinhamento' => 'center'])

<div class="text-{{ $alinhamento }} mb-16">
    @if($tag)
        <span class="text-{{ $cor }} font-semibold text-sm uppercase tracking-widest">
            {{ $tag }}
        </span>
    @endif

    <h2 class="section-title mt-2">{{ $titulo }}</h2>

    @if($subtitulo)
        <p class="section-subtitle">{{ $subtitulo }}</p>
    @endif
</div>
```

### card-servico.blade.php

```blade
@props(['servico'])

<div class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100
            hover:shadow-xl hover:-translate-y-1 hover:border-primary/20
            transition-all duration-300 cursor-pointer">

    {{-- Ícone --}}
    <div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5
                group-hover:bg-primary transition-colors duration-300">
        <span class="text-2xl">{{ $servico->icone }}</span>
    </div>

    <h3 class="font-heading text-lg font-semibold mb-2 group-hover:text-primary
               transition-colors">
        {{ $servico->nome }}
    </h3>

    <p class="text-gray-600 text-sm leading-relaxed">
        {{ $servico->descricao }}
    </p>

    <div class="mt-4 flex items-center gap-1 text-primary text-sm font-medium
                opacity-0 group-hover:opacity-100 transition-opacity">
        Saiba mais
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
    </div>
</div>
```

---

## 14. Assets e Recursos Visuais

### Organização de Assets em `/public/images/`

```
public/images/
├── logos/
│   ├── logo-principal.png       → 200px+ de largura
│   ├── logo-branco.png          → Versão clara (navbar transparente)
│   ├── logo-escuro.png          → Versão escura (navbar com scroll)
│   ├── logo-icone.png           → Apenas símbolo
│   └── favicon.ico              → 32x32px e 64x64px
│
├── background.png               → Imagem principal de hero
│                                   Dimensão ideal: 1920x1080px
│                                   Formato: JPG otimizado (< 300KB)
│
├── servicos/                    → Imagens das categorias de serviço
│   ├── hidraulica.jpg
│   ├── eletrica.jpg
│   └── ...
│
└── og-image.png                 → Open Graph 1200x630px para redes sociais
```

### Otimização de Imagens

```bash
# Instalar Intervention Image
composer require intervention/image

# No ImageService ou via queue job
use Intervention\Image\Facades\Image;

Image::make(public_path('images/background.png'))
     ->resize(1920, 1080, function ($c) { $c->aspectRatio(); })
     ->save(null, 85); // Qualidade 85%
```

### Vite - Configuração de Assets

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/landing.js',
            ],
            refresh: true,
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'alpine': ['alpinejs'],
                }
            }
        }
    }
});
```

---

## 15. Responsividade e Acessibilidade

### Breakpoints Tailwind

```
xs: 375px   → Smartphones pequenos
sm: 640px   → Smartphones grandes
md: 768px   → Tablets
lg: 1024px  → Desktops pequenos
xl: 1280px  → Desktops
2xl: 1536px → Monitores grandes
```

### Estratégia Mobile-First

- Todos os componentes desenvolvidos pensando em mobile primeiro
- Navbar: hambúrguer em sm/xs, completa em md+
- Hero: 1 coluna em mobile, 2 em lg+
- Grid de serviços: 1 → 2 → 3 colunas
- Footer: stack vertical em mobile, horizontal em md+

### Acessibilidade (WCAG 2.1 AA)

```blade
{{-- Exemplos de atributos obrigatórios --}}

{{-- Links --}}
<a href="#" aria-label="Ir para seção de serviços">Serviços</a>

{{-- Imagens --}}
<img src="{{ asset('images/logos/logo.png') }}"
     alt="PredialFix - Gestão de Manutenção Predial"
     width="200" height="50">

{{-- Formulários --}}
<label for="nome" class="form-label">Nome completo *</label>
<input id="nome" type="text" aria-required="true" aria-describedby="nome-help">
<span id="nome-help" class="text-xs text-gray-500">Digite seu nome completo</span>

{{-- Botões --}}
<button aria-label="Fechar modal" aria-expanded="true">✕</button>

{{-- Skip links --}}
<a href="#main-content"
   class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
          bg-primary text-white px-4 py-2 rounded-lg z-50">
    Pular para o conteúdo principal
</a>
```

### Contraste de Cores

| Combinação | Ratio | WCAG AA |
|------------|-------|---------|
| Texto escuro sobre branco | 12.6:1 | ✅ AAA |
| Branco sobre `#fc9432` | 3.1:1 | ✅ AA (grande) |
| Branco sobre `#00c2a8` | 2.9:1 | ⚠️ AA (grandes) |
| Branco sobre `#1071e5` | 4.7:1 | ✅ AA |
| Texto escuro sobre `#cfe4ff` | 8.2:1 | ✅ AAA |

> ⚠️ Verificar contrastes finais via [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## 16. SEO e Performance

### Meta Tags e Open Graph

```blade
{{-- No layout landing.blade.php --}}
<meta name="description" content="{{ $metaDescription ?? 'PredialFix — Gestão inteligente de manutenção predial. Chamados, prestadores e relatórios em um só lugar.' }}">
<meta name="keywords" content="manutenção predial, gestão de chamados, condomínio, síndico">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{{ url()->current() }}">

{{-- Open Graph --}}
<meta property="og:type" content="website">
<meta property="og:title" content="PredialFix — Gestão de Manutenção Predial">
<meta property="og:description" content="...">
<meta property="og:image" content="{{ asset('images/og-image.png') }}">
<meta property="og:url" content="{{ url('/') }}">

{{-- Twitter Card --}}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="PredialFix">
<meta name="twitter:image" content="{{ asset('images/og-image.png') }}">
```

### Cache e Performance

```php
// config/predialfix.php
'cache_ttl' => [
    'landing' => 3600,      // 1 hora
    'servicos' => 86400,    // 24 horas
    'faqs' => 86400,        // 24 horas
],

// Em LandingController
public function index(): View
{
    $servicos = Cache::remember('servicos_landing', 86400, fn() =>
        Categoria::where('ativo', true)->orderBy('ordem')->get()
    );

    return view('landing.index', compact('servicos', ...));
}
```

### Otimizações de Performance

```bash
# Comandos de deploy/produção
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
npm run build   # Vite build otimizado

# OPcache no Laragon
# Habilitar no php.ini:
opcache.enable=1
opcache.memory_consumption=128
```

### Lazy Loading de Imagens

```blade
{{-- Usar loading="lazy" em todas as imagens below-the-fold --}}
<img src="{{ asset('images/servicos/hidraulica.jpg') }}"
     alt="Serviços Hidráulicos"
     loading="lazy"
     width="400" height="300">
```

---

## 17. Segurança

### Configurações de Segurança Laravel

```php
// Middleware CSRF já incluso pelo Laravel
// Adicionar em rotas de API se necessário:
Route::middleware(['throttle:api'])->group(...);

// Rate limiting para formulários
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('/lead', [ContatoController::class, 'storeLead']);
    Route::post('/contato', [ContatoController::class, 'storeContato']);
});
```

### Validação de Formulários

```php
// app/Http/Requests/ContatoRequest.php
class ContatoRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'email:rfc,dns', 'max:255'],
            'telefone' => ['required', 'string', 'regex:/^\(\d{2}\) \d{4,5}-\d{4}$/'],
            'tipo_imovel' => ['nullable', 'in:residencial,comercial,industrial,condominio'],
            'mensagem' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome é obrigatório.',
            'email.email' => 'Informe um e-mail válido.',
            'telefone.regex' => 'Informe um telefone no formato (11) 99999-9999.',
        ];
    }
}
```

### Headers de Segurança

```php
// app/Http/Middleware/SecurityHeaders.php
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        return $response;
    }
}
```

---

## 18. Guia de Implementação Passo a Passo

### Fase 1 — Setup do Ambiente (Laragon)

```bash
# 1. Criar novo projeto Laravel
cd C:\laragon\www
composer create-project laravel/laravel predialfix

# 2. Configurar .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=predialfix
DB_USERNAME=root
DB_PASSWORD=

APP_NAME="PredialFix"
APP_URL=http://predialfix.test

# 3. Criar virtual host no Laragon
# Menu Laragon > Apache > Sites > Adicionar predialfix.test

# 4. Instalar dependências
composer install
npm install

# 5. Gerar key
php artisan key:generate
```

### Fase 2 — Instalação dos Pacotes

```bash
# Laravel Breeze
composer require laravel/breeze --dev
php artisan breeze:install blade --dark
npm install && npm run dev

# Filament
composer require filament/filament:"^3.2" -W
php artisan filament:install --panels

# Spatie Permissions
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Spatie Media Library
composer require spatie/laravel-medialibrary
php artisan vendor:publish --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="migrations"

# Intervention Image
composer require intervention/image

# Alpine.js extras (mask plugin)
npm install @alpinejs/mask

# x-collapse (Alpine plugin)
npm install @alpinejs/collapse
```

### Fase 3 — Migrations e Seeders

```bash
# Criar e executar migrations
php artisan make:migration create_condominios_table
php artisan make:migration create_categorias_table
php artisan make:migration create_chamados_table
php artisan make:migration create_leads_table
php artisan make:migration create_historico_chamados_table
php artisan make:migration add_custom_fields_to_users_table

php artisan migrate

# Criar seeders
php artisan make:seeder AdminUserSeeder
php artisan make:seeder CategoriasSeeder
php artisan make:seeder DatabaseSeeder

php artisan db:seed
```

### Fase 4 — Landing Page

```bash
# Criar controller
php artisan make:controller LandingController
php artisan make:controller ContatoController

# Criar views
mkdir -p resources/views/landing/partials
mkdir -p resources/views/components

# Criar componentes Blade
php artisan make:component Navbar
php artisan make:component Footer
php artisan make:component CardServico
php artisan make:component CardDepoimento

# Configurar rotas em routes/web.php
```

### Fase 5 — Filament Resources

```bash
php artisan make:filament-resource User --generate
php artisan make:filament-resource Condominio --generate
php artisan make:filament-resource Chamado --generate
php artisan make:filament-resource Lead --generate
php artisan make:filament-resource Categoria --generate

# Widgets
php artisan make:filament-widget StatsOverview --stats-overview
php artisan make:filament-widget ChamadosChart --chart
php artisan make:filament-widget AtividadesRecentes --table
```

### Fase 6 — Polish e Otimização

```bash
# Tailwind purge + build final
npm run build

# Otimizar autoload
composer dump-autoload --optimize

# Caches de produção
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Testes básicos
php artisan test
```

### Checklist de Validação

```
□ Landing page carrega < 2s (verificar com Lighthouse)
□ Score Lighthouse ≥ 90 (Performance, SEO, Acessibilidade)
□ Formulário de lead funciona e envia e-mail
□ Login/registro funcionando com redirect por role
□ Filament acessível apenas por admins
□ Chamados: CRUD completo funcionando
□ Upload de fotos em chamados funcionando
□ Responsivo: testar em 375px, 768px, 1280px
□ Todas as imagens com alt text
□ Favicon configurado
□ Meta tags Open Graph corretas
□ HTTPS configurado em produção
□ Rate limiting nos formulários
□ Soft deletes nos models críticos
□ Identidade visual 1:1 com o Figma ✅ (CRÍTICO)
```

---

## 19. Referências de Arquivos do Projeto

> Os seguintes caminhos locais devem ser usados como base e referência durante o desenvolvimento:

| Recurso | Caminho Local | Uso |
|---------|---------------|-----|
| **Estrutura Laravel Base** | `C:\Users\39039450803\Documents\Etheria\Projeto_3DEV\PredialFix` | Copiar estrutura de pastas, convenções de nomenclatura e padrões já estabelecidos |
| **Protótipo Landing Page** | `C:\...\Protótipos\Responsive Landing Page Design v2.0` | Base de design para a landing page — seguir fielmente |
| **Logos (PNG)** | `C:\...\Arquivos\Img\Logos\` | Copiar para `/public/images/logos/` — usar nas variações de navbar e footer |
| **Background** | `C:\...\Arquivos\Img\BackGound.png` | Copiar para `/public/images/background.png` — usar no Hero Section |
| **Telas Figma** | `C:\...\Arquivos\Telas\` | **REFERÊNCIA PRINCIPAL DE DESIGN** — implementar 1:1 pixel-perfect |

### ⚠️ Prioridades de Referência

1. **Telas do Figma** (`/Telas/`) → Máxima prioridade. Identidade visual deve ser seguida 1:1
2. **Protótipo Landing Page** → Guia de layout e organização de seções
3. **Estrutura Laravel Base** → Convenções de código e estrutura já existente
4. **Logos e Background** → Assets definitivos — não criar substitutos

---

## Notas Finais para o Desenvolvedor

> Este PRD é um documento vivo. Qualquer alteração de escopo deve ser documentada aqui antes de ser implementada.

**Prioridade de entrega sugerida:**
1. Setup completo do ambiente Laragon
2. Estrutura base do Laravel com Breeze e Filament instalados
3. Landing page completa (seguindo Figma 1:1)
4. Sistema de leads funcionando
5. Autenticação e portal do usuário
6. Painel Filament completo
7. Testes e otimizações finais

**Contato do projeto:**
- Repositório: `C:\Users\39039450803\Documents\Etheria\Projeto_3DEV\PredialFix`
- Organização: Etheria / Projeto 3DEV

---

*Documento gerado em Abril 2026 — PredialFix PRD v1.0*
