<?php

use Illuminate\Support\Facades\Route;

/*
| Rotas web reservadas ao painel admin (Filament).
| A interface principal do SaaS é o frontend React separado.
*/

Route::redirect('/', '/admin');
