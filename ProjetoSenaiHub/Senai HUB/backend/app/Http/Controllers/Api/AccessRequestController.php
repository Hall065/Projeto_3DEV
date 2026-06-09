<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccessRequest;
use App\Services\Notification\SystemNotificationTriggers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'organization' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $accessRequest = AccessRequest::query()->create([
            ...$validated,
            'status' => 'pending',
        ]);

        app(SystemNotificationTriggers::class)->accessRequestSubmitted($accessRequest);

        return response()->json([
            'message' => 'Solicitacao recebida. O administrador entrara em contato em breve.',
            'data' => [
                'id' => $accessRequest->id,
            ],
        ], 201);
    }
}
