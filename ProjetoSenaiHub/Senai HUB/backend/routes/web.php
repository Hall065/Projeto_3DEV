<?php

use Illuminate\Support\Facades\Route;

/*
| API Laravel — interface principal via frontend React (Vite).
*/

Route::redirect('/', rtrim((string) env('FRONTEND_URL', 'http://127.0.0.1:5173'), '/'));
