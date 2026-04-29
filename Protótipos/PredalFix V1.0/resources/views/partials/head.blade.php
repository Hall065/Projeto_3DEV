<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>
    {{ filled($title ?? null) ? $title.' | '.config('app.name', 'PredialFix') : config('app.name', 'PredialFix') }}
</title>

<meta name="description" content="{{ $metaDescription ?? 'PredialFix — gestão de manutenção predial para unidades SENAI.' }}" />
<meta name="robots" content="index,follow" />
<meta property="og:type" content="website" />
<meta property="og:title" content="{{ filled($title ?? null) ? $title.' | '.config('app.name', 'PredialFix') : config('app.name', 'PredialFix') }}" />
<meta property="og:description" content="{{ $metaDescription ?? 'PredialFix — gestão de manutenção predial para unidades SENAI.' }}" />
<meta property="og:url" content="{{ url()->current() }}" />

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

@vite(['resources/css/app.css', 'resources/js/app.js'])
@fluxAppearance
