<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectStudent;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $studentsQuery = $user
            ? UserAccessScope::connectStudentQuery($user)
            : ConnectStudent::query();

        $studentsByStatus = (clone $studentsQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $marksQuery = $user
            ? UserAccessScope::attendanceMarkQuery($user)
            : ConnectAttendanceMark::query();

        $attendanceByStatus = (clone $marksQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $classesQuery = $user
            ? UserAccessScope::connectClassQuery($user)
            : ConnectClass::query();

        $activeClasses = (clone $classesQuery)->where('status', 'active')->count();
        $totalStudents = (clone $studentsQuery)->count();
        $activeContracts = ConnectContract::query()->where('status', 'active')->count();

        $present = (int) ($attendanceByStatus['present'] ?? 0) + (int) ($attendanceByStatus['late'] ?? 0);
        $totalMarks = max(array_sum($attendanceByStatus->all()), 1);
        $rate = round(($present / $totalMarks) * 100, 1);

        return response()->json([
            'data' => [
                'summary' => "Resumo academico: {$totalStudents} aluno(s) no seu escopo, {$activeClasses} turma(s) ativa(s), taxa de presenca {$rate}% nas marcacoes registradas.",
                'students_by_status' => $studentsByStatus,
                'attendance_by_status' => $attendanceByStatus,
                'active_contracts' => $activeContracts,
                'active_classes' => $activeClasses,
                'attendance_rate' => $rate,
                'generated_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
