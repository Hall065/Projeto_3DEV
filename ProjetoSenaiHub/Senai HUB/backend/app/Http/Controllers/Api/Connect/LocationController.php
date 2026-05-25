<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectStudentLocationResource;
use App\Models\Connect\ConnectStudentLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectStudentLocation::query()
            ->with(['student.connectClass'])
            ->orderByDesc('last_seen_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->whereHas('student', function ($builder) use ($search): void {
                $builder->where('full_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $locations = $query->paginate($request->integer('per_page', 15));

        return ConnectStudentLocationResource::collection($locations)->response();
    }
}
