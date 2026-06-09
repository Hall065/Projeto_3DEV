<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectLessonSchedule;
use App\Models\Connect\ConnectStudent;
use App\Support\ConnectAttendanceStats;
use Illuminate\Support\Collection;

class ConnectAttendanceService
{
    /**
     * Cria sessões de frequência (status open) para aulas sem chamada vinculada.
     *
     * @return array{created: int, skipped: int}
     */
    public function provisionSessionsForClass(ConnectClass $class, ?Collection $lessons = null): array
    {
        $class->loadMissing(['students']);

        $lessons ??= ConnectLessonSchedule::query()
            ->where('connect_class_id', $class->id)
            ->where('status', '!=', 'cancelled')
            ->whereDoesntHave('attendanceSession')
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->get();

        $created = 0;
        $skipped = 0;

        foreach ($lessons as $lesson) {
            if ($lesson->attendanceSession()->exists()) {
                $skipped++;

                continue;
            }

            $session = ConnectAttendanceSession::query()->create([
                'connect_class_id' => $class->id,
                'connect_teacher_id' => $lesson->connect_teacher_id ?? $class->connect_teacher_id,
                'connect_lesson_schedule_id' => $lesson->id,
                'session_date' => $lesson->scheduled_date,
                'subject' => $lesson->subject,
                'lessons_count' => $lesson->lessons_count ?? $class->default_lessons_per_day ?? 4,
                'status' => 'open',
            ]);

            foreach ($class->students as $student) {
                ConnectAttendanceMark::query()->create([
                    'connect_attendance_session_id' => $session->id,
                    'connect_student_id' => $student->id,
                    'status' => 'present',
                    'missed_lessons' => 0,
                ]);
            }

            $created++;
        }

        return compact('created', 'skipped');
    }

    public function provisionSessionForLesson(ConnectLessonSchedule $lesson): ConnectAttendanceSession
    {
        $lesson->loadMissing(['connectClass.students']);
        $class = $lesson->connectClass;

        $existing = $lesson->attendanceSession;
        if ($existing) {
            return $existing;
        }

        $session = ConnectAttendanceSession::query()->create([
            'connect_class_id' => $class->id,
            'connect_teacher_id' => $lesson->connect_teacher_id ?? $class->connect_teacher_id,
            'connect_lesson_schedule_id' => $lesson->id,
            'session_date' => $lesson->scheduled_date,
            'subject' => $lesson->subject,
            'lessons_count' => $lesson->lessons_count ?? $class->default_lessons_per_day ?? 4,
            'status' => 'open',
        ]);

        foreach ($class->students as $student) {
            ConnectAttendanceMark::query()->firstOrCreate(
                [
                    'connect_attendance_session_id' => $session->id,
                    'connect_student_id' => $student->id,
                ],
                ['status' => 'present', 'missed_lessons' => 0],
            );
        }

        return $session;
    }

    /**
     * @return array<string, mixed>
     */
    public function classSummary(ConnectClass $class, ?string $from = null, ?string $to = null): array
    {
        $lessonsQuery = ConnectLessonSchedule::query()
            ->where('connect_class_id', $class->id)
            ->where('status', '!=', 'cancelled');

        if ($from) {
            $lessonsQuery->whereDate('scheduled_date', '>=', $from);
        }
        if ($to) {
            $lessonsQuery->whereDate('scheduled_date', '<=', $to);
        }

        $totalLessons = (int) (clone $lessonsQuery)->count();
        $completedLessons = (int) (clone $lessonsQuery)->where('status', 'completed')->count();

        $sessionsQuery = ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->with('marks');

        if ($from) {
            $sessionsQuery->whereDate('session_date', '>=', $from);
        }
        if ($to) {
            $sessionsQuery->whereDate('session_date', '<=', $to);
        }

        $sessions = $sessionsQuery->get();
        $closedSessions = $sessions->where('status', 'closed')->count();
        $openSessions = $sessions->where('status', 'open')->count();

        $allMarks = $sessions->flatMap(fn ($s) => $s->marks);
        $totalMarks = $allMarks->count();
        $present = $allMarks->whereIn('status', ['present', 'late'])->count();
        $justified = $allMarks->where('status', 'justified')->count();
        $absent = $allMarks->where('status', 'absent')->count();

        $studentsCount = $class->students()->count();
        $lessonsWithoutAttendance = max(0, $totalLessons - $sessions->count());

        return [
            'class_id' => $class->id,
            'class_name' => $class->name,
            'semester' => $class->semester,
            'students_count' => $studentsCount,
            'total_scheduled_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'attendance_sessions_total' => $sessions->count(),
            'attendance_sessions_closed' => $closedSessions,
            'attendance_sessions_open' => $openSessions,
            'lessons_without_attendance' => $lessonsWithoutAttendance,
            'presence_rate' => $totalMarks > 0 ? round(($present / $totalMarks) * 100, 1) : 0,
            'marks_summary' => [
                'total' => $totalMarks,
                'present' => $present,
                'justified' => $justified,
                'absent' => $absent,
            ],
            'period' => ['from' => $from, 'to' => $to],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function studentSummary(ConnectStudent $student, ConnectClass $class): array
    {
        $summary = ConnectAttendanceStats::studentSummary($student, $class);

        $sessionsTotal = ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->where('status', 'closed')
            ->count();

        $studentMarks = ConnectAttendanceMark::query()
            ->where('connect_student_id', $student->id)
            ->whereHas('session', fn ($q) => $q->where('connect_class_id', $class->id))
            ->with('session')
            ->get();

        $presentSessions = $studentMarks->whereIn('status', ['present', 'late'])->count();
        $justifiedSessions = $studentMarks->where('status', 'justified')->count();
        $absentSessions = $studentMarks->where('status', 'absent')->count();

        return [
            ...$summary,
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'class_id' => $class->id,
            'closed_sessions_total' => $sessionsTotal,
            'sessions_present' => $presentSessions,
            'sessions_justified' => $justifiedSessions,
            'sessions_absent' => $absentSessions,
            'attendance_rate' => $studentMarks->count() > 0
                ? round(($presentSessions / $studentMarks->count()) * 100, 1)
                : 0,
        ];
    }
}
