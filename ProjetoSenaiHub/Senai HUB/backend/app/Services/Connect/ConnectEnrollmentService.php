<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\HubPerson;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConnectEnrollmentService
{
    public function attachPersonToCourse(
        HubPerson $person,
        ConnectCourse $course,
        string $role,
        ?string $enrolledAt = null,
    ): void {
        $exists = $course->people()
            ->where('hub_people.id', $person->id)
            ->wherePivot('role', $role)
            ->exists();

        if ($exists) {
            $course->people()->updateExistingPivot($person->id, [
                'status' => 'active',
                'enrolled_at' => $enrolledAt ?? now()->toDateString(),
            ]);

            return;
        }

        $course->people()->attach($person->id, [
            'role' => $role,
            'status' => 'active',
            'enrolled_at' => $enrolledAt ?? now()->toDateString(),
        ]);
    }

    public function detachPersonFromCourse(HubPerson $person, ConnectCourse $course, string $role): void
    {
        DB::table('connect_course_hub_person')
            ->where('connect_course_id', $course->id)
            ->where('hub_person_id', $person->id)
            ->where('role', $role)
            ->delete();
    }

    public function attachStudentToClass(HubPerson $person, ConnectClass $class, ?string $joinedAt = null): void
    {
        $exists = $class->enrolledPeople()->where('hub_people.id', $person->id)->exists();

        if ($exists) {
            $class->enrolledPeople()->updateExistingPivot($person->id, [
                'status' => 'active',
                'joined_at' => $joinedAt ?? now()->toDateString(),
            ]);

            return;
        }

        $class->enrolledPeople()->attach($person->id, [
            'role' => 'student',
            'status' => 'active',
            'joined_at' => $joinedAt ?? now()->toDateString(),
        ]);
    }

    public function detachStudentFromClass(HubPerson $person, ConnectClass $class): void
    {
        $class->enrolledPeople()->detach($person->id);
    }

    public function syncPivotsForStudent(ConnectStudent $student): void
    {
        $person = $student->hubPerson;
        if (! $person || ! $student->connect_class_id) {
            return;
        }

        $class = ConnectClass::query()->with('course')->find($student->connect_class_id);
        if (! $class?->course) {
            return;
        }

        $this->attachStudentToClass($person, $class);
        $this->attachPersonToCourse($person, $class->course, 'student');
    }

    public function syncTeacherCourseFromClass(ConnectClass $class): void
    {
        $class->loadMissing('teacher.hubPerson', 'course');
        $person = $class->teacher?->hubPerson;
        if (! $person || ! $class->course) {
            return;
        }

        $this->attachPersonToCourse($person, $class->course, 'teacher');
    }

    /**
     * Vincula a turma ao curso (se ainda não estiver) e matricula os alunos da turma no curso.
     *
     * @return array{connect_class_id: int, class_name: string, class_code: string, enrolled: int, skipped: int, total: int}
     */
    public function enrollClassInCourse(ConnectClass $class, ConnectCourse $course): array
    {
        return DB::transaction(function () use ($class, $course) {
            if ($class->connect_course_id !== null && (int) $class->connect_course_id !== (int) $course->id) {
                throw ValidationException::withMessages([
                    'connect_class_id' => 'Esta turma já está vinculada a outro curso.',
                ]);
            }

            if ($class->connect_course_id === null) {
                $class->update(['connect_course_id' => $course->id]);
                $class->refresh();
            }

            $class->loadMissing('course');
            $this->syncTeacherCourseFromClass($class);

            $people = $this->resolveClassStudents($class);
            $enrolled = 0;
            $skipped = 0;

            foreach ($people as $person) {
                if (! $person->isStudent()) {
                    $skipped++;

                    continue;
                }

                $alreadyEnrolled = $course->people()
                    ->where('hub_people.id', $person->id)
                    ->wherePivot('role', 'student')
                    ->exists();

                $this->attachPersonToCourse($person, $course, 'student');

                if ($alreadyEnrolled) {
                    $skipped++;
                } else {
                    $enrolled++;
                }
            }

            return [
                'connect_class_id' => $class->id,
                'class_name' => $class->name,
                'class_code' => $class->code,
                'enrolled' => $enrolled,
                'skipped' => $skipped,
                'total' => $people->count(),
            ];
        });
    }

    /** @return Collection<int, HubPerson> */
    private function resolveClassStudents(ConnectClass $class): Collection
    {
        $class->load(['enrolledPeople', 'students.hubPerson']);

        $fromPivot = $class->enrolledPeople
            ->filter(fn (HubPerson $person) => $person->isStudent());

        $fromLegacy = $class->students
            ->map(fn (ConnectStudent $student) => $student->hubPerson)
            ->filter(fn ($person) => $person instanceof HubPerson);

        return $fromPivot
            ->concat($fromLegacy)
            ->unique('id')
            ->values();
    }
}
