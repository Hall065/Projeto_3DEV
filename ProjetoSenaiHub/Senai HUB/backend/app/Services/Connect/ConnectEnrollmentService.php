<?php

namespace App\Services\Connect;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\HubPerson;
use Illuminate\Support\Facades\DB;

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
}
