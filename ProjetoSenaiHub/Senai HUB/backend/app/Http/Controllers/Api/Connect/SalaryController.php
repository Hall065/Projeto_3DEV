<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectSalaryRecordResource;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectSalaryRecord;
use App\Models\Connect\ConnectStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ConnectSalaryRecord::query()
            ->with(['student.hubPerson', 'student.connectClass'])
            ->orderByDesc('reference_month');

        if ($request->filled('connect_student_id')) {
            $query->where('connect_student_id', $request->integer('connect_student_id'));
        }

        if ($request->filled('reference_month')) {
            $month = Carbon::parse($request->string('reference_month')->toString())->startOfMonth();
            $query->whereDate('reference_month', $month);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $records = $query->paginate($request->integer('per_page', 15));

        return ConnectSalaryRecordResource::collection($records)->response();
    }

    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_student_id' => ['required', 'exists:connect_students,id'],
            'reference_month' => ['required', 'date_format:Y-m'],
            'bonuses' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
        ]);

        $student = ConnectStudent::query()->findOrFail($validated['connect_student_id']);
        $referenceMonth = Carbon::createFromFormat('Y-m', $validated['reference_month'])->startOfMonth();

        $activeContract = ConnectContract::query()
            ->where('connect_student_id', $student->id)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $referenceMonth->copy()->endOfMonth())
            ->where(function ($query) use ($referenceMonth): void {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $referenceMonth);
            })
            ->orderByDesc('start_date')
            ->first();

        $baseAmount = (float) ($activeContract?->monthly_value ?? 1518.00);
        $attendance = $this->studentAttendanceSummary($student->id, $referenceMonth);
        $workDays = 22;
        $dailyRate = round($baseAmount / $workDays, 2);
        $absenceDeduction = round($dailyRate * $attendance['unjustified_absences'], 2);
        $bonuses = (float) ($validated['bonuses'] ?? 0);
        $deductions = (float) ($validated['deductions'] ?? $absenceDeduction);
        $netAmount = max($baseAmount + $bonuses - $deductions, 0);

        $record = ConnectSalaryRecord::query()->updateOrCreate(
            [
                'connect_student_id' => $student->id,
                'reference_month' => $referenceMonth,
            ],
            [
                'base_amount' => $baseAmount,
                'bonuses' => $bonuses,
                'deductions' => $deductions,
                'net_amount' => $netAmount,
                'status' => 'calculated',
                'calculated_at' => now(),
            ],
        );

        $record->load('student.connectClass');

        return response()->json([
            'data' => new ConnectSalaryRecordResource($record),
            'attendance' => $attendance,
            'daily_rate' => $dailyRate,
            'message' => 'Bolsa/remuneracao calculada com sucesso.',
        ]);
    }

    /**
     * @return array{total_days: int, present_days: int, justified_absences: int, unjustified_absences: int, rate: float}
     */
    private function studentAttendanceSummary(int $studentId, Carbon $month): array
    {
        $sessionIds = ConnectAttendanceSession::query()
            ->whereYear('session_date', $month->year)
            ->whereMonth('session_date', $month->month)
            ->pluck('id');

        $marks = ConnectAttendanceMark::query()
            ->where('connect_student_id', $studentId)
            ->whereIn('connect_attendance_session_id', $sessionIds)
            ->get();

        $total = $marks->count();
        $present = $marks->whereIn('status', ['present', 'late'])->count();
        $justified = $marks->where('status', 'justified')->count();
        $absent = $marks->where('status', 'absent')->count();
        $rate = $total > 0 ? round(($present / $total) * 100, 1) : 0.0;

        return [
            'total_days' => $total,
            'present_days' => $present,
            'justified_absences' => $justified,
            'unjustified_absences' => $absent,
            'rate' => $rate,
        ];
    }
}
