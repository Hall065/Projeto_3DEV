<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportPreset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportPresetController extends Controller
{
    public function index(Request $request, string $module): JsonResponse
    {
        $presets = ReportPreset::query()
            ->where('module', $module)
            ->where(function ($q) use ($request) {
                $q->where('user_id', $request->user()->id)
                    ->orWhere('is_shared', true);
            })
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $presets->map(fn (ReportPreset $preset) => $this->serialize($preset, $request->user()->id)),
        ]);
    }

    public function store(Request $request, string $module): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'config' => ['required', 'array'],
            'is_shared' => ['sometimes', 'boolean'],
        ]);

        $preset = ReportPreset::query()->create([
            'user_id' => $request->user()->id,
            'module' => $module,
            'name' => $validated['name'],
            'config' => $validated['config'],
            'is_shared' => $validated['is_shared'] ?? false,
        ]);

        return response()->json([
            'data' => $this->serialize($preset, $request->user()->id),
        ], 201);
    }

    public function update(Request $request, string $module, ReportPreset $preset): JsonResponse
    {
        $this->authorizePreset($request, $module, $preset);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'config' => ['sometimes', 'array'],
            'is_shared' => ['sometimes', 'boolean'],
        ]);

        $preset->update($validated);

        return response()->json([
            'data' => $this->serialize($preset->fresh(), $request->user()->id),
        ]);
    }

    public function destroy(Request $request, string $module, ReportPreset $preset): JsonResponse
    {
        $this->authorizePreset($request, $module, $preset);
        $preset->delete();

        return response()->json([
            'message' => 'Preset removido.',
        ]);
    }

    private function authorizePreset(Request $request, string $module, ReportPreset $preset): void
    {
        if ($preset->module !== $module || $preset->user_id !== $request->user()->id) {
            abort(403, 'Voce nao pode alterar este preset.');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ReportPreset $preset, int $userId): array
    {
        return [
            'id' => $preset->id,
            'name' => $preset->name,
            'module' => $preset->module,
            'config' => $preset->config,
            'is_shared' => $preset->is_shared,
            'is_owner' => $preset->user_id === $userId,
            'created_at' => $preset->created_at?->toIso8601String(),
        ];
    }
}
