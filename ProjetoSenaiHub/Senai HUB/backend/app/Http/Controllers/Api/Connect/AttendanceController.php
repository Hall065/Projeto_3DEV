<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectAttendanceSessionResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectStudent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'connect_class_id' => ['required', 'exists:connect_classes,id'],
            'session_date' => ['nullable', 'date'],
            'subject' => ['nullable', 'string', 'max:255'],
        ]);

        $sessionDate = isset($validated['session_date'])
            ? Carbon::parse($validated['session_date'])->toDateString()
            : now()->toDateString();

        $subject = $validated['subject'] ?? 'Aula regular';

        $class = ConnectClass::query()
            ->with(['students', 'teacher'])
            ->findOrFail($validated['connect_class_id']);

        $session = ConnectAttendanceSession::query()->firstOrCreate(
            [
                'connect_class_id' => $class->id,
                'session_date' => $sessionDate,
                'subject' => $subject,
            ],
            [
                'connect_teacher_id' => $class->connect_teacher_id,
                'status' => 'open',
            ],
        );

        $existingStudentIds = $session->marks()->pluck('connect_student_id');

        $class->students->each(function (ConnectStudent $student) use ($session, $existingStudentIds): void {
            if ($existingStudentIds->contains($student->id)) {
                return;
            }

            ConnectAttendanceMark::query()->create([
                'connect_attendance_session_id' => $session->id,
                'connect_student_id' => $student->id,
                'status' => 'present',
            ]);
        });

        $session->load(['connectClass.course', 'teacher', 'marks.student']);

        return response()->json([
            'data' => new ConnectAttendanceSessionResource($session),
        ]);
    }

    public function saveMarks(Request $request, ConnectAttendanceSession $session): JsonResponse
    {
        $validated = $request->validate([
            'marks' => ['required', 'array', 'min:1'],
            'marks.*.connect_student_id' => ['required', 'exists:connect_students,id'],
            'marks.*.status' => ['required', Rule::in(['present', 'absent', 'justified', 'late'])],
            'marks.*.notes' => ['nullable', 'string'],
            'close_session' => ['nullable', 'boolean'],
        ]);

        foreach ($validated['marks'] as $mark) {
            ConnectAttendanceMark::query()->updateOrCreate(
                [
                    'connect_attendance_session_id' => $session->id,
                    'connect_student_id' => $mark['connect_student_id'],
                ],
                [
                    'status' => $mark['status'],
                    'notes' => $mark['notes'] ?? null,
                ],
            );
        }

        if ($request->boolean('close_session')) {
            $session->update(['status' => 'closed']);
        }

        ConnectActivity::query()->create([
            'title' => 'Frequência registrada',
            'description' => "Chamada da turma {$session->connectClass?->code} em {$session->session_date?->format('d/m/Y')}.",
            'type' => 'attendance',
            'entity_type' => 'attendance_session',
            'entity_id' => $session->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $session->load(['connectClass.course', 'teacher', 'marks.student']);

        return response()->json([
            'data' => new ConnectAttendanceSessionResource($session),
            'message' => 'Frequência salva com sucesso.',
        ]);
    }
}
