<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @include('partials.head')
    </head>
    <body>
        @php
            $navItems = [
                ['label' => 'Dashboard', 'route' => 'dashboard'],
                ['label' => 'Chamados', 'route' => 'chamados.index'],
                ['label' => 'Tarefas', 'route' => 'tarefas.index'],
                ['label' => 'Relatórios', 'route' => 'relatorios.index'],
                ['label' => 'Estoque', 'route' => 'estoques.index'],
                ['label' => 'Usuários', 'route' => 'usuarios.index'],
            ];
        @endphp

        <div class="pf-page">
            <div class="pf-shell">
                <div class="pf-cubes">
                    @foreach ([
                        ['size' => 94, 'left' => '-18px', 'bottom' => '18px', 'rotate' => 'rotateX(-18deg) rotateY(30deg)'],
                        ['size' => 56, 'left' => '30px', 'bottom' => '150px', 'rotate' => 'rotateX(-24deg) rotateY(28deg)'],
                        ['size' => 42, 'left' => '66px', 'bottom' => '245px', 'rotate' => 'rotateX(-20deg) rotateY(32deg)'],
                        ['size' => 78, 'left' => '200px', 'bottom' => '-24px', 'rotate' => 'rotateX(-20deg) rotateY(35deg)'],
                        ['size' => 48, 'right' => '160px', 'top' => '64px', 'rotate' => 'rotateX(-16deg) rotateY(-30deg)'],
                        ['size' => 38, 'right' => '112px', 'top' => '28px', 'rotate' => 'rotateX(-16deg) rotateY(-34deg)'],
                    ] as $cube)
                        <div class="pf-cube" style="--size: {{ $cube['size'] }}px; width: {{ $cube['size'] }}px; height: {{ $cube['size'] }}px; left: {{ $cube['left'] ?? 'auto' }}; right: {{ $cube['right'] ?? 'auto' }}; top: {{ $cube['top'] ?? 'auto' }}; bottom: {{ $cube['bottom'] ?? 'auto' }}; transform: {{ $cube['rotate'] }};">
                            <span class="pf-cube-face front"></span>
                            <span class="pf-cube-face back"></span>
                            <span class="pf-cube-face right"></span>
                            <span class="pf-cube-face left"></span>
                            <span class="pf-cube-face top"></span>
                            <span class="pf-cube-face bottom"></span>
                        </div>
                    @endforeach
                </div>

                <div class="pf-shell-grid">
                    <aside class="pf-sidebar">
                        <a href="{{ route('dashboard') }}" class="pf-sidebar-logo">
                            <img src="{{ asset('images/logos/logo-branco.png') }}" alt="PredialFix" />
                        </a>

                        <nav class="pf-nav">
                            @foreach ($navItems as $item)
                                <a
                                    href="{{ route($item['route']) }}"
                                    class="pf-nav-link {{ request()->routeIs($item['route']) ? 'is-active' : '' }}"
                                >
                                    {{ $item['label'] }}
                                </a>
                            @endforeach

                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button class="pf-nav-link w-full text-left" type="submit">Sair</button>
                            </form>
                        </nav>
                    </aside>

                    <main class="pf-main">
                        <header class="pf-topbar">
                            <div class="flex items-center gap-3">
                                <div class="pf-mobile-toggle">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-5">
                                        <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" stroke-width="1.8" />
                                    </svg>
                                </div>
                                <div class="pf-page-title">{{ $title ?? config('app.name', 'PredialFix') }}</div>
                            </div>

                            <div class="pf-topbar-user">
                                <div class="text-right">
                                    <div class="font-heading text-lg font-semibold text-white">Bem-Vindo {{ Str::of(auth()->user()->name)->explode(' ')->first() }}</div>
                                    <div class="text-sm text-white/45">{{ auth()->user()->email }}</div>
                                </div>
                                <div class="pf-avatar">{{ auth()->user()->initials() }}</div>
                                <svg class="pf-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.36.632 1.724 1.724 0 0 0 2.107.79 1.724 1.724 0 0 1 2.066 2.066 1.724 1.724 0 0 0 .79 2.107 1.724 1.724 0 0 1 .632 2.36 1.724 1.724 0 0 0 1.066 2.573 1.724 1.724 0 0 1 0 3.35 1.724 1.724 0 0 0-1.066 2.573 1.724 1.724 0 0 1-.632 2.36 1.724 1.724 0 0 0-2.107.79 1.724 1.724 0 0 1-2.066 2.066 1.724 1.724 0 0 0-2.107.79 1.724 1.724 0 0 1-2.36.632 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.36-.632 1.724 1.724 0 0 0-2.107-.79 1.724 1.724 0 0 1-2.066-2.066 1.724 1.724 0 0 0-.79-2.107 1.724 1.724 0 0 1-.632-2.36 1.724 1.724 0 0 0-1.066-2.573 1.724 1.724 0 0 1 0-3.35 1.724 1.724 0 0 0 1.066-2.573 1.724 1.724 0 0 1 .632-2.36 1.724 1.724 0 0 0 .79-2.107 1.724 1.724 0 0 1 2.066-2.066 1.724 1.724 0 0 0 2.107-.79 1.724 1.724 0 0 1 2.36-.632 1.724 1.724 0 0 0 2.573-1.066Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0Z" />
                                </svg>
                            </div>
                        </header>

                        <div class="pf-mobile-nav">
                            @foreach ($navItems as $item)
                                <a
                                    href="{{ route($item['route']) }}"
                                    class="pf-chip {{ request()->routeIs($item['route']) ? 'bg-[rgba(104,31,40,0.82)] text-white' : '' }}"
                                >
                                    {{ $item['label'] }}
                                </a>
                            @endforeach
                        </div>

                        <div class="pf-content">
                            {{ $slot }}
                        </div>
                    </main>
                </div>
            </div>
        </div>

        @fluxScripts
    </body>
</html>
