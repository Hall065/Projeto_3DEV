<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary(): JsonResponse
    {
        $studentsByStatus = ConnectStudent::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $attendanceByStatus = ConnectAttendanceMark::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $activeContracts = ConnectContract::query()->where('status', 'active')->count();
        $activeClasses = ConnectClass::query()->where('status', 'active')->count();

        return response()->json([
            'data' => [
                'summary' => 'Relatórios consolidados do SENAI Connect (placeholder).',
                'students_by_status' => $studentsByStatus,
                'attendance_by_status' => $attendanceByStatus,
                'active_contracts' => $activeContracts,
                'active_classes' => $activeClasses,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
