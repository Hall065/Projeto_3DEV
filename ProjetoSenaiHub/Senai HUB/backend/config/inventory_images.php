<?php

/**
 * Imagens PNG/JPG estáveis (Wikimedia Commons) — fallback quando a API não retorna resultado.
 */
return [
    'user_agent' => 'SenaiHub/1.0 (inventory images; educational project)',

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
        'Mouse Óptico USB' => 'https://upload.wikimedia.org/wikipedia/commons/9/97/Crystal_Project_mouse.png',
        'Lâmpada LED 18W' => 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Incandescent_light_bulb.png',
        'Filtro de ar HVAC' => 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Air_filter.jpg',
        'Cabo HDMI 2m' => 'https://upload.wikimedia.org/wikipedia/commons/9/9f/HDMI_connector.jpg',
        'Selante silicone' => 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Silicone-glue.jpg',
    ],

    'category_fallbacks' => [
        'Informática' => 'https://upload.wikimedia.org/wikipedia/commons/9/97/Crystal_Project_mouse.png',
        'Elétrica' => 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Incandescent_light_bulb.png',
        'Climatização' => 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Air_filter.jpg',
        'Hidráulica' => 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Silicone-glue.jpg',
    ],
];
