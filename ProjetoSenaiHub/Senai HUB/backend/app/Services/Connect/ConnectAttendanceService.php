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
    public function __construct(
        private readonly ConnectEnrollmentService $enrollment,
    ) {}

    /**
     * Cria sessões de frequência (status open) para aulas sem chamada vinculada.
     *
     * @return array{created: int, skipped: int, marks_added: int}
     */
    public function provisionSessionsForClass(ConnectClass $class, ?Collection $lessons = null): array
    {
        $students = $this->enrollment->resolveClassConnectStudents($class);
        if ($students->isEmpty()) {
            return ['created' => 0, 'skipped' => 0, 'marks_added' => 0];
        }

        $lessons ??= ConnectLessonSchedule::query()
            ->where('connect_class_id', $class->id)
            ->where('status', '!=', 'cancelled')
            ->orderBy('scheduled_date')
            ->orderBy('start_time')
            ->get();

        $created = 0;
        $skipped = 0;
        $marksAdded = 0;

        foreach ($lessons as $lesson) {
            if ($lesson->attendanceSession()->exists()) {
                $session = $lesson->attendanceSession()->first();
                if ($session) {
                    $marksAdded += $this->ensureMarksForStudents($session, $class, $students);
                }
                $skipped++;

                continue;
            }

            $session = $this->findOrCreateSession(
                $class,
                $lesson->scheduled_date?->format('Y-m-d') ?? now()->toDateString(),
                (string) $lesson->subject,
                $lesson,
                students: $students,
            );

            $marksAdded += $session->marks()->count();
            $created++;
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'marks_added' => $marksAdded,
        ];
    }

    public function backfillMarksForClass(ConnectClass $class): int
    {
        $students = $this->enrollment->resolveClassConnectStudents($class);
        if ($students->isEmpty()) {
            return 0;
        }

        $added = 0;
        $sessions = ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->get();

        foreach ($sessions as $session) {
            $added += $this->ensureMarksForStudents($session, $class, $students);
        }

        return $added;
    }

    public function provisionSessionForLesson(ConnectLessonSchedule $lesson): ConnectAttendanceSession
    {
        $lesson->loadMissing(['connectClass']);
        $class = $lesson->connectClass;
        $students = $this->enrollment->resolveClassConnectStudents($class);

        return $this->findOrCreateSession(
            $class,
            $lesson->scheduled_date?->format('Y-m-d') ?? now()->toDateString(),
            (string) $lesson->subject,
            $lesson,
            students: $students,
        );
    }

    /**
     * @param  Collection<int, ConnectStudent>|null  $students
     */
    public function findOrCreateSession(
        ConnectClass $class,
        string $sessionDate,
        string $subject,
        ?ConnectLessonSchedule $lesson = null,
        ?int $lessonsCount = null,
        ?Collection $students = null,
    ): ConnectAttendanceSession {
        $class->loadMissing(['teacher']);
        $students ??= $this->enrollment->resolveClassConnectStudents($class);

        $lessonsCount ??= $lesson?->lessons_count ?? $class->default_lessons_per_day ?? 4;
        $teacherId = $lesson?->connect_teacher_id ?? $class->connect_teacher_id;

        if ($lesson) {
            $byLesson = ConnectAttendanceSession::query()
                ->where('connect_lesson_schedule_id', $lesson->id)
                ->first();

            if ($byLesson) {
                $this->ensureMarksForStudents($byLesson, $class, $students);

                return $byLesson;
            }
        }

        $session = ConnectAttendanceSession::query()
            ->where('connect_class_id', $class->id)
            ->whereDate('session_date', $sessionDate)
            ->where('subject', $subject)
            ->first();

        if ($session) {
            $updates = [];

            if ($lesson && ! $session->connect_lesson_schedule_id) {
                $updates['connect_lesson_schedule_id'] = $lesson->id;
            }

            if (! $session->connect_teacher_id && $teacherId) {
                $updates['connect_teacher_id'] = $teacherId;
            }

            if ($session->lessons_count !== $lessonsCount) {
                $updates['lessons_count'] = $lessonsCount;
            }

            if ($updates !== []) {
                $session->update($updates);
                $session->refresh();
            }

            $this->ensureMarksForStudents($session, $class, $students);

            return $session;
        }

        $session = ConnectAttendanceSession::query()->create([
            'connect_class_id' => $class->id,
            'connect_teacher_id' => $teacherId,
            'connect_lesson_schedule_id' => $lesson?->id,
            'session_date' => $sessionDate,
            'subject' => $subject,
            'lessons_count' => $lessonsCount,
            'status' => 'open',
        ]);

        $this->ensureMarksForStudents($session, $class, $students);

        return $session;
    }

    /**
     * @param  Collection<int, ConnectStudent>  $students
     */
    private function ensureMarksForStudents(
        ConnectAttendanceSession $session,
        ConnectClass $class,
        Collection $students,
    ): int {
        $existingStudentIds = $session->marks()->pluck('connect_student_id');
        $added = 0;

        foreach ($students as $student) {
            if ($existingStudentIds->contains($student->id)) {
                continue;
            }

            ConnectAttendanceMark::query()->create([
                'connect_attendance_session_id' => $session->id,
                'connect_student_id' => $student->id,
                'status' => 'present',
                'missed_lessons' => 0,
            ]);
            $added++;
        }

        return $added;
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

        $studentsCount = $this->enrollment->resolveClassConnectStudents($class)->count();
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
