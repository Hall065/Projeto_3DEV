<?php

namespace App\Http\Controllers\Api\Connect;

use App\Http\Controllers\Controller;
use App\Http\Resources\Connect\ConnectAttendanceSessionResource;
use App\Models\Connect\ConnectActivity;
use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectStudent;
use App\Support\UserAccessScope;
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
            'lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $sessionDate = isset($validated['session_date'])
            ? Carbon::parse($validated['session_date'])->toDateString()
            : now()->toDateString();

        $subject = $validated['subject'] ?? 'Aula regular';

        $class = UserAccessScope::connectClassQuery($request->user())
            ->with(['students.hubPerson', 'teacher.hubPerson'])
            ->findOrFail($validated['connect_class_id']);

        $allowedStudentIds = UserAccessScope::connectStudentQuery($request->user())->pluck('id');
        $class->setRelation(
            'students',
            $class->students->whereIn('id', $allowedStudentIds)->values(),
        );

        $lessonsCount = $validated['lessons_count']
            ?? $class->default_lessons_per_day
            ?? 4;

        $session = ConnectAttendanceSession::query()->firstOrCreate(
            [
                'connect_class_id' => $class->id,
                'session_date' => $sessionDate,
                'subject' => $subject,
            ],
            [
                'connect_teacher_id' => $class->connect_teacher_id,
                'lessons_count' => $lessonsCount,
                'status' => 'open',
            ],
        );

        if ($session->lessons_count !== $lessonsCount) {
            $session->update(['lessons_count' => $lessonsCount]);
        }

        $existingStudentIds = $session->marks()->pluck('connect_student_id');

        $class->students->each(function (ConnectStudent $student) use ($session, $existingStudentIds): void {
            if ($existingStudentIds->contains($student->id)) {
                return;
            }

            ConnectAttendanceMark::query()->create([
                'connect_attendance_session_id' => $session->id,
                'connect_student_id' => $student->id,
                'status' => 'present',
                'missed_lessons' => 0,
            ]);
        });

        $session->load(['connectClass.course', 'teacher.hubPerson', 'marks.student.hubPerson']);
        $session->setRelation('connectClass', $class);

        return response()->json([
            'data' => new ConnectAttendanceSessionResource($session),
        ]);
    }

    public function saveMarks(Request $request, ConnectAttendanceSession $session): JsonResponse
    {
        $session->load('connectClass');

        $validated = $request->validate([
            'lessons_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'max_absences_allowed' => ['nullable', 'integer', 'min:1', 'max:999'],
            'default_lessons_per_day' => ['nullable', 'integer', 'min:1', 'max:5'],
            'marks' => ['required', 'array', 'min:1'],
            'marks.*.connect_student_id' => ['required', 'exists:connect_students,id'],
            'marks.*.status' => ['required', Rule::in(['present', 'absent', 'justified', 'late'])],
            'marks.*.missed_lessons' => ['nullable', 'integer', 'min:0', 'max:5'],
            'marks.*.max_absences_allowed' => ['nullable', 'integer', 'min:1', 'max:999'],
            'marks.*.notes' => ['nullable', 'string'],
            'close_session' => ['nullable', 'boolean'],
        ]);

        $lessonsCount = $validated['lessons_count'] ?? $session->lessons_count ?? 4;
        $session->update(['lessons_count' => $lessonsCount]);

        $class = $session->connectClass;
        if ($class) {
            $classUpdates = [];
            if (array_key_exists('max_absences_allowed', $validated) && $validated['max_absences_allowed'] !== null) {
                $classUpdates['max_absences_allowed'] = $validated['max_absences_allowed'];
            }
            if (array_key_exists('default_lessons_per_day', $validated) && $validated['default_lessons_per_day'] !== null) {
                $classUpdates['default_lessons_per_day'] = $validated['default_lessons_per_day'];
            }
            if ($classUpdates !== []) {
                $class->update($classUpdates);
            }
        }

        foreach ($validated['marks'] as $mark) {
            $status = $mark['status'];
            $missed = (int) ($mark['missed_lessons'] ?? 0);

            if ($status === 'present' || $status === 'late') {
                $missed = 0;
            } elseif ($status === 'absent' && $missed === 0) {
                $missed = $lessonsCount;
            }

            $missed = min($missed, $lessonsCount);

            ConnectAttendanceMark::query()->updateOrCreate(
                [
                    'connect_attendance_session_id' => $session->id,
                    'connect_student_id' => $mark['connect_student_id'],
                ],
                [
                    'status' => $status,
                    'missed_lessons' => $missed,
                    'notes' => $mark['notes'] ?? null,
                ],
            );

            if (array_key_exists('max_absences_allowed', $mark) && $mark['max_absences_allowed'] !== null) {
                ConnectStudent::query()
                    ->where('id', $mark['connect_student_id'])
                    ->update(['max_absences_allowed' => $mark['max_absences_allowed']]);
            }
        }

        if ($request->boolean('close_session')) {
            $session->update(['status' => 'closed']);
        }

        ConnectActivity::query()->create([
            'title' => 'Frequência registrada',
            'description' => "Chamada da turma {$session->connectClass?->code} em {$session->session_date?->format('d/m/Y')} ({$lessonsCount} aula(s)).",
            'type' => 'attendance',
            'entity_type' => 'attendance_session',
            'entity_id' => $session->id,
            'performed_by' => $request->user()?->name ?? 'Sistema',
            'occurred_at' => now(),
        ]);

        $session->load(['connectClass.course', 'teacher.hubPerson', 'marks.student.hubPerson']);

        return response()->json([
            'data' => new ConnectAttendanceSessionResource($session),
            'message' => 'Frequência salva com sucesso.',
        ]);
    }
}
