<?php

return [
    /*
    |--------------------------------------------------------------------------
    | E-mail transacional (padrão confeccaoTB → Hub)
    |--------------------------------------------------------------------------
    |
    | notification_email: caixa usada quando redirect_all está ativo (dev/testes).
    | redirect_all: em ambientes não-produção, todos os e-mails vão para notification_email.
    |
    | O envio em si usa HubMailDispatcher + HubNotificationMail (equivalente a
    | AtelierNotifier + AtelierMail do projeto confeccaoTB).
    */
    'mail' => [
        'notification_email' => env('HUB_NOTIFICATION_EMAIL', 'hall065.2022@gmail.com'),
        'redirect_all' => env('HUB_REDIRECT_ALL_MAIL', env('APP_ENV') !== 'production'),
    ],

    'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:5173'),

    /*
    | Posições no mapa 3D do campus: true = simulação (demo), false = ocultar aviso (futuro: coords reais).
    */
    'campus_map_simulation' => env('CAMPUS_MAP_SIMULATION', true),

    /*
    | Metadados dos blocos do campus (fonte única para mapa 3D e APIs públicas).
    | position: centro aproximado do bloco no modelo GLB (eixos X/Y/Z do Three.js).
    */
    'campus_blocks' => [
        ['id' => 'A', 'name' => 'Bloco A', 'position' => ['x' => -28.5, 'y' => 0, 'z' => -18.2]],
        ['id' => 'B', 'name' => 'Bloco B', 'position' => ['x' => -9.4, 'y' => 0, 'z' => -18.2]],
        ['id' => 'C', 'name' => 'Bloco C', 'position' => ['x' => 9.8, 'y' => 0, 'z' => -18.2]],
        ['id' => 'D', 'name' => 'Bloco D', 'position' => ['x' => 28.6, 'y' => 0, 'z' => -18.2]],
    ],

    /*
    | Coordenadas 3D por sala (bloco + identificador da sala).
    | Usadas pelo mapa quando CAMPUS_MAP_SIMULATION=false.
    */
    'campus_rooms' => [
        ['block_id' => 'A', 'room' => '101', 'position' => ['x' => -31.2, 'y' => 2.4, 'z' => -14.8]],
        ['block_id' => 'A', 'room' => '102', 'position' => ['x' => -27.8, 'y' => 2.4, 'z' => -16.1]],
        ['block_id' => 'A', 'room' => '201', 'position' => ['x' => -29.5, 'y' => 5.8, 'z' => -20.4]],
        ['block_id' => 'A', 'room' => '203', 'position' => ['x' => -26.1, 'y' => 5.8, 'z' => -17.9]],
        ['block_id' => 'A', 'room' => 'Sala 15', 'position' => ['x' => -30.4, 'y' => 8.2, 'z' => -15.6]],
        ['block_id' => 'A', 'room' => 'Patrimonio', 'position' => ['x' => -25.6, 'y' => 2.1, 'z' => -19.8]],
        ['block_id' => 'B', 'room' => '101', 'position' => ['x' => -12.1, 'y' => 2.4, 'z' => -15.2]],
        ['block_id' => 'B', 'room' => '102', 'position' => ['x' => -8.7, 'y' => 2.4, 'z' => -16.8]],
        ['block_id' => 'B', 'room' => '203', 'position' => ['x' => -10.3, 'y' => 5.8, 'z' => -20.1]],
        ['block_id' => 'B', 'room' => 'Recepcao', 'position' => ['x' => -7.2, 'y' => 2.0, 'z' => -14.4]],
        ['block_id' => 'B', 'room' => 'Biblioteca', 'position' => ['x' => -11.8, 'y' => 3.6, 'z' => -21.3]],
        ['block_id' => 'C', 'room' => 'Lab. 1', 'position' => ['x' => 7.4, 'y' => 2.6, 'z' => -15.9]],
        ['block_id' => 'C', 'room' => 'Lab. 2', 'position' => ['x' => 11.2, 'y' => 2.6, 'z' => -17.4]],
        ['block_id' => 'C', 'room' => 'Lab. Informatica', 'position' => ['x' => 9.1, 'y' => 2.6, 'z' => -20.6]],
        ['block_id' => 'C', 'room' => '201', 'position' => ['x' => 8.3, 'y' => 5.8, 'z' => -14.1]],
        ['block_id' => 'D', 'room' => 'Oficina', 'position' => ['x' => 25.8, 'y' => 2.2, 'z' => -16.7]],
        ['block_id' => 'D', 'room' => 'Coordenacao', 'position' => ['x' => 30.1, 'y' => 3.4, 'z' => -14.2]],
        ['block_id' => 'D', 'room' => 'Sala 15', 'position' => ['x' => 27.4, 'y' => 5.8, 'z' => -19.5]],
    ],
];
