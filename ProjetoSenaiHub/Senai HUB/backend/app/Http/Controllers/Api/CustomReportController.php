<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Services\Reports\CustomReportService;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomReportController extends Controller
{
    public function __construct(
        private readonly CustomReportService $reports,
        private readonly PermissionService $permissions,
    ) {}

    public function schema(Request $request, string $module): JsonResponse
    {
        $this->authorizeModule($request->user(), $module);

        return response()->json([
            'data' => $this->reports->schema($module),
        ]);
    }

    public function filterOptions(Request $request, string $module): JsonResponse
    {
        $this->authorizeModule($request->user(), $module);

        $user = $request->user();

        $options = match ($module) {
            'connect' => [
                'courses' => ConnectCourse::query()->orderBy('name')->get(['id', 'code', 'name']),
                'classes' => UserAccessScope::connectClassQuery($user)
                    ->with('course')
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'connect_course_id']),
            ],
            'grid' => [
                'blocks' => \App\Models\Grid\GridTicket::query()
                    ->whereNotNull('block')
                    ->where('block', '!=', '')
                    ->distinct()
                    ->orderBy('block')
                    ->pluck('block')
                    ->values(),
            ],
            default => [],
        };

        return response()->json(['data' => $options]);
    }

    public function build(Request $request, string $module): JsonResponse
    {
        $this->authorizeModule($request->user(), $module);

        $report = $this->reports->build($module, $request->all(), $request->user());

        return response()->json(['data' => $report]);
    }

    public function exportCsv(Request $request, string $module): StreamedResponse
    {
        $this->authorizeModule($request->user(), $module);

        return $this->reports->exportCsv($module, $request->all(), $request->user());
    }

    public function exportHtml(Request $request, string $module): \Illuminate\View\View|\Illuminate\Http\Response
    {
        $this->authorizeModule($request->user(), $module);

        $download = $request->boolean('download');

        return $this->reports->exportHtml($module, $request->all(), $request->user(), $download);
    }

    public function exportXlsx(Request $request, string $module): StreamedResponse
    {
        $this->authorizeModule($request->user(), $module);

        return $this->reports->exportXlsx($module, $request->all(), $request->user());
    }

    public function exportJson(Request $request, string $module): JsonResponse
    {
        $this->authorizeModule($request->user(), $module);

        return $this->reports->exportJson($module, $request->all(), $request->user());
    }

    private function authorizeModule(?User $user, string $module): void
    {
        if ($user === null) {
            abort(401);
        }

        $allowed = match ($module) {
            'connect' => $this->permissions->can($user, 'connect.reports.view')
                || $this->permissions->can($user, 'connect.reports.manage'),
            'grid' => $this->permissions->can($user, 'grid.reports.view'),
            default => false,
        };

        if (! $allowed) {
            abort(403, 'Sem permissao para relatorios deste modulo.');
        }
    }
}
