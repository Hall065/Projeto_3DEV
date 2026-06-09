<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PublicConfigController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'campus_map_simulation' => (bool) config('hub.campus_map_simulation', true),
                'campus_blocks' => config('hub.campus_blocks', []),
            ],
        ]);
    }
}
