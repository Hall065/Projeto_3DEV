<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @include('partials.head')
    </head>
    <body>
        <div class="pf-auth-page">
            <div class="pf-cubes">
                @foreach ([
                    ['size' => 110, 'left' => '-22px', 'bottom' => '-24px', 'rotate' => 'rotateX(-18deg) rotateY(32deg)'],
                    ['size' => 74, 'left' => '64px', 'bottom' => '18px', 'rotate' => 'rotateX(-22deg) rotateY(26deg)'],
                    ['size' => 58, 'left' => '152px', 'bottom' => '-18px', 'rotate' => 'rotateX(-18deg) rotateY(32deg)'],
                    ['size' => 58, 'right' => '16%', 'top' => '16px', 'rotate' => 'rotateX(-18deg) rotateY(-32deg)'],
                    ['size' => 42, 'right' => '8%', 'top' => '56px', 'rotate' => 'rotateX(-18deg) rotateY(-32deg)'],
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

            <div class="pf-auth-card">
                {{ $slot }}
            </div>
        </div>
        @fluxScripts
    </body>
</html>
