<x-layouts::auth :title="__('Entrar')">
    <img src="{{ asset('images/logos/logo-branco.png') }}" alt="PredialFix" class="pf-auth-logo" />

    <div class="pf-auth-title">Login</div>
    <p class="pf-auth-subtitle">Bem Vindo ao portal online SENAI-SP</p>

    @if (session('status'))
        <div class="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {{ session('status') }}
        </div>
    @endif

    @if ($errors->any())
        <div class="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {{ $errors->first() }}
        </div>
    @endif

    <form method="POST" action="{{ route('login.store') }}" class="space-y-4">
            @csrf

        <div>
            <label class="pf-label" for="email">Usuário</label>
            <input id="email" name="email" type="text" value="{{ old('email') }}" required autofocus autocomplete="username" class="pf-input" />
        </div>

        <div>
            <label class="pf-label" for="password">Senha</label>
            <input id="password" name="password" type="password" required autocomplete="current-password" class="pf-input" />
        </div>

        <div class="flex items-center justify-between gap-4 text-sm text-white/60">
            <label class="inline-flex items-center gap-2">
                <input name="remember" type="checkbox" class="rounded border-white/20 bg-white/10" />
                <span>Lembrar de mim</span>
            </label>

            @if (Route::has('password.request'))
                <a href="{{ route('password.request') }}" class="text-white/70 hover:text-white" wire:navigate>Esqueci minha senha</a>
            @endif
        </div>

        <button type="submit" class="pf-btn pf-btn-primary w-full" data-test="login-button">Avançar</button>
    </form>

    @if (Route::has('register'))
        <div class="mt-5 text-center text-sm text-white/60">
            Não Possui conta?
            <a href="{{ route('register') }}" class="font-semibold text-red-400 hover:text-red-300" wire:navigate>Fazer Cadastro</a>
        </div>
    @endif
</x-layouts::auth>
