<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Services\Connect\ConnectCampusMapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampusMapController extends Controller
{
    public function __construct(
        private readonly ConnectCampusMapService $campusMap,
    ) {}

    public function people(Request $request): JsonResponse
    {
        $simulation = (bool) config('hub.campus_map_simulation', true);

        return response()->json([
            'data' => $this->campusMap->peopleForUser($request->user(), $simulation),
            'meta' => [
                'simulation' => $simulation,
                'source' => 'api',
            ],
        ]);
    }
}
