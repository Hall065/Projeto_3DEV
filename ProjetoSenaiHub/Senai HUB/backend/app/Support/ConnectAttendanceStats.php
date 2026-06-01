<?php

namespace App\Support;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectStudent;

class ConnectAttendanceStats
{
    /** Total de aulas faltadas (injustificadas) do aluno na turma. */
    public static function unjustifiedLessonsTotal(int $studentId, int $classId): int
    {
        return (int) ConnectAttendanceMark::query()
            ->where('connect_student_id', $studentId)
            ->where('status', 'absent')
            ->whereHas('session', fn ($q) => $q->where('connect_class_id', $classId))
            ->sum('missed_lessons');
    }

    public static function maxAbsencesAllowed(ConnectStudent $student, ConnectClass $class): ?int
    {
        return $student->max_absences_allowed ?? $class->max_absences_allowed;
    }

    /**
     * @return array{unjustified_lessons_total: int, max_absences_allowed: int|null, remaining_absences: int|null}
     */
    public static function studentSummary(ConnectStudent $student, ConnectClass $class): array
    {
        $total = self::unjustifiedLessonsTotal($student->id, $class->id);
        $max = self::maxAbsencesAllowed($student, $class);

        return [
            'unjustified_lessons_total' => $total,
            'max_absences_allowed' => $max,
            'remaining_absences' => $max !== null ? max(0, $max - $total) : null,
        ];
    }
}
