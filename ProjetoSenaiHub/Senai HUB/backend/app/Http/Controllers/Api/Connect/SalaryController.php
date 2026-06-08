<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectSalaryRecordResource;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectSalaryRecord;
use App\Models\Connect\ConnectStudent;
use App\Support\HubRole;
use App\Support\UserAccessScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $this->scopedQuery($request)
            ->with(['student.hubPerson', 'student.connectClass.course'])
            ->orderByDesc('reference_month');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->whereHas('student', function ($q) use ($search): void {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

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

        $summaryQuery = clone $query;
        $summary = [
            'total_records' => (int) $summaryQuery->count(),
            'total_base' => round((float) $summaryQuery->sum('base_amount'), 2),
            'total_net' => round((float) $summaryQuery->sum('net_amount'), 2),
            'total_deductions' => round((float) $summaryQuery->sum('deductions'), 2),
            'total_bonuses' => round((float) $summaryQuery->sum('bonuses'), 2),
        ];

        $records = $query->paginate($request->integer('per_page', 15));

        return ConnectSalaryRecordResource::collection($records)
            ->additional(['summary' => $summary])
            ->response();
    }

    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_student_id' => ['required', 'exists:connect_students,id'],
            'reference_month' => ['required', 'date_format:Y-m'],
            'bonuses' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->assertCanAccessStudent($request, (int) $validated['connect_student_id']);

        $payload = $this->buildCalculation(
            (int) $validated['connect_student_id'],
            $validated['reference_month'],
            isset($validated['bonuses']) ? (float) $validated['bonuses'] : null,
            isset($validated['deductions']) ? (float) $validated['deductions'] : null,
        );

        return response()->json(['data' => $payload]);
    }

    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_student_id' => ['required', 'exists:connect_students,id'],
            'reference_month' => ['required', 'date_format:Y-m'],
            'bonuses' => ['nullable', 'numeric', 'min:0'],
            'deductions' => ['nullable', 'numeric', 'min:0'],
        ]);

        $this->assertCanAccessStudent($request, (int) $validated['connect_student_id']);

        $payload = $this->buildCalculation(
            (int) $validated['connect_student_id'],
            $validated['reference_month'],
            isset($validated['bonuses']) ? (float) $validated['bonuses'] : null,
            isset($validated['deductions']) ? (float) $validated['deductions'] : null,
        );

        $record = ConnectSalaryRecord::query()->updateOrCreate(
            [
                'connect_student_id' => $payload['student']['id'],
                'reference_month' => $payload['reference_month'],
            ],
            [
                'base_amount' => $payload['amounts']['base'],
                'bonuses' => $payload['amounts']['bonuses'],
                'deductions' => $payload['amounts']['deductions'],
                'net_amount' => $payload['amounts']['net'],
                'status' => 'calculated',
                'calculated_at' => now(),
            ],
        );

        $record->load('student.connectClass.course');

        return response()->json([
            'data' => new ConnectSalaryRecordResource($record),
            'attendance' => $payload['attendance'],
            'daily_rate' => $payload['daily_rate'],
            'contract' => $payload['contract'],
            'breakdown' => $payload['breakdown'],
            'message' => 'Bolsa/remuneracao calculada com sucesso.',
        ]);
    }

    public function calculateBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference_month' => ['required', 'date_format:Y-m'],
        ]);

        $studentIds = UserAccessScope::connectStudentQuery($request->user())->pluck('id');
        $processed = 0;
        $errors = [];

        foreach ($studentIds as $studentId) {
            try {
                $payload = $this->buildCalculation((int) $studentId, $validated['reference_month']);

                ConnectSalaryRecord::query()->updateOrCreate(
                    [
                        'connect_student_id' => $studentId,
                        'reference_month' => $payload['reference_month'],
                    ],
                    [
                        'base_amount' => $payload['amounts']['base'],
                        'bonuses' => $payload['amounts']['bonuses'],
                        'deductions' => $payload['amounts']['deductions'],
                        'net_amount' => $payload['amounts']['net'],
                        'status' => 'calculated',
                        'calculated_at' => now(),
                    ],
                );

                $processed++;
            } catch (\Throwable $e) {
                $errors[] = ['connect_student_id' => $studentId, 'message' => $e->getMessage()];
            }
        }

        return response()->json([
            'processed' => $processed,
            'errors' => $errors,
            'message' => "{$processed} registro(s) calculado(s) para o mes informado.",
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildCalculation(
        int $studentId,
        string $referenceMonth,
        ?float $bonusesOverride = null,
        ?float $deductionsOverride = null,
    ): array {
        $student = ConnectStudent::query()
            ->with(['connectClass.course', 'hubPerson'])
            ->findOrFail($studentId);

        $month = Carbon::createFromFormat('Y-m', $referenceMonth)->startOfMonth();

        $activeContract = ConnectContract::query()
            ->where('connect_student_id', $student->id)
            ->where('status', 'active')
            ->whereDate('start_date', '<=', $month->copy()->endOfMonth())
            ->where(function ($query) use ($month): void {
                $query->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $month);
            })
            ->orderByDesc('start_date')
            ->first();

        $baseAmount = (float) ($activeContract?->monthly_value ?? 1518.00);
        $attendance = $this->studentAttendanceSummary($student->id, $month);
        $workDays = 22;
        $dailyRate = round($baseAmount / $workDays, 2);
        $absenceDeduction = round($dailyRate * $attendance['unjustified_absences'], 2);
        $bonuses = $bonusesOverride ?? 0.0;
        $deductions = $deductionsOverride ?? $absenceDeduction;
        $netAmount = max($baseAmount + $bonuses - $deductions, 0);

        return [
            'student' => [
                'id' => $student->id,
                'full_name' => $student->full_name,
                'registration_number' => $student->registration_number,
                'class_name' => $student->connectClass?->name,
                'course_name' => $student->connectClass?->course?->name,
            ],
            'reference_month' => $month->format('Y-m-d'),
            'attendance' => $attendance,
            'daily_rate' => $dailyRate,
            'contract' => $activeContract ? [
                'id' => $activeContract->id,
                'company_name' => $activeContract->company_name,
                'monthly_value' => (float) $activeContract->monthly_value,
                'status' => $activeContract->status,
            ] : null,
            'amounts' => [
                'base' => $baseAmount,
                'bonuses' => $bonuses,
                'deductions' => $deductions,
                'net' => $netAmount,
                'absence_deduction' => $absenceDeduction,
            ],
            'breakdown' => [
                ['label' => 'Salario base (contrato)', 'value' => $baseAmount, 'type' => 'base'],
                ['label' => 'Bonificacoes', 'value' => $bonuses, 'type' => 'bonus'],
                ['label' => 'Desconto por faltas injustificadas', 'value' => -$absenceDeduction, 'type' => 'deduction'],
                ['label' => 'Outros descontos', 'value' => -max($deductions - $absenceDeduction, 0), 'type' => 'deduction'],
                ['label' => 'Valor liquido', 'value' => $netAmount, 'type' => 'net'],
            ],
            'work_days' => $workDays,
        ];
    }

    private function scopedQuery(Request $request)
    {
        $query = ConnectSalaryRecord::query();
        $user = $request->user();

        if ($user && $user->role === HubRole::CONNECT_ALUNO) {
            $studentId = ConnectStudent::query()->where('user_id', $user->id)->value('id');
            $query->where('connect_student_id', $studentId ?? 0);
        } elseif ($user && $user->role === HubRole::CONNECT_EMPRESA) {
            $studentIds = UserAccessScope::connectStudentQuery($user)->pluck('id');
            $query->whereIn('connect_student_id', $studentIds);
        }

        return $query;
    }

    private function assertCanAccessStudent(Request $request, int $studentId): void
    {
        $user = $request->user();
        if (! $user || HubRole::isAdmin($user->role)) {
            return;
        }

        $allowed = UserAccessScope::connectStudentQuery($user)
            ->whereKey($studentId)
            ->exists();

        abort_unless($allowed, 403, 'Voce nao tem permissao para calcular o salario deste aluno.');
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
