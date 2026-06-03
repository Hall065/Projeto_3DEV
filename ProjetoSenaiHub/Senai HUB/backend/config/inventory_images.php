<?php



/**

 * Imagens estáveis (Wikimedia Commons, formato /thumb/) — fallback quando a API não retorna resultado.

 */

return [

    'user_agent' => 'SenaiHub/1.0 (inventory images; educational project)',



    /** Fragmentos de URLs antigas que retornam 404 — forçam re-resolução. */

    'legacy_broken_url_fragments' => [

        'Crystal_Project_mouse.png',

        'Incandescent_light_bulb.png',

        '/8/8d/Air_filter.jpg',

        '/9/9f/HDMI_connector.jpg',

        'Silicone-glue.jpg',

        'OOjs_UI_icon_package.svg',

        '/7/7f/Keyboard.png',

        'Ethernet_cable.jpg',

        'Screw_head.jpg',

        'Paint_roller.jpg',

        'AC_power_plugs_and_sockets.jpg',

        'Miniature_circuit_breaker.jpg',

        'Fan_rotating.gif',

        'PVC_pipe.jpg',

        'Ball_valve.jpg',

        '/512px-',

    ],



    'search_terms' => [

        'Mouse Óptico USB' => 'computer mouse PNG',

        'Lâmpada LED 18W' => 'LED lamp bulb',

        'Filtro de ar HVAC' => 'HVAC air filter',

        'Cabo HDMI 2m' => 'HDMI cable',

        'Selante silicone' => 'silicone sealant tube',

    ],



    'category_terms' => [

        'Informática' => 'computer hardware icon',

        'Elétrica' => 'electrical supplies light bulb',

        'Climatização' => 'HVAC ventilation filter',

        'Hidráulica' => 'plumbing supplies',

    ],



    'title_fallbacks' => [

        'Mouse Óptico USB' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',

        'Lâmpada LED 18W' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'Filtro de ar HVAC' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',

        'Cabo HDMI 2m' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/HDMI_Cable_1.JPG/330px-HDMI_Cable_1.JPG',

        'Selante silicone' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

    ],



    'category_fallbacks' => [

        'Informática' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',

        'Elétrica' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'Climatização' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',

        'Hidráulica' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

    ],



    'default_fallback' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Gnome-emblem-package.svg/330px-Gnome-emblem-package.svg.png',



    'keyword_fallbacks' => [

        'mouse' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',

        'teclado' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg/330px-2023_Mysz_komputerowa_Logitech_G903_Lightspeed.jpg',

        'lampada' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'lâmpada' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'led' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'filtro' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',

        'hdmi' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/HDMI_Cable_1.JPG/330px-HDMI_Cable_1.JPG',

        'cabo' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Ethernet_connector.webp/330px-Ethernet_connector.webp.png',

        'selante' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

        'silicone' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

        'parafuso' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Sechskantschrauben_--_2020_--_3985-8.jpg/330px-Sechskantschrauben_--_2020_--_3985-8.jpg',

        'tinta' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Paint-roller_%2823956075297%29.jpg/330px-Paint-roller_%2823956075297%29.jpg',

        'tomada' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg/330px-Low-key_photograph_of_light_bulb%2C_Straume%2C_Norway_julesvernex2.jpg',

        'disjuntor' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Circuit_breaker_2_pole_on_DIN_rail.JPG/330px-Circuit_breaker_2_pole_on_DIN_rail.JPG',

        'ventilador' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_Filtr_powietrza_DEMCiflex.jpg/330px-2014_Filtr_powietrza_DEMCiflex.jpg',

        'tubo' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

        'valvula' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

        'válvula' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg/330px-Leaking_PVC_Pipe_Under_Sink_-_P_Trap_%2852842956605%29.jpg',

    ],

];

