<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\HubPerson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConnectCourseRosterFromClassTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_enroll_class_students_into_course(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $course = ConnectCourse::query()->firstOrFail();
        $class = ConnectClass::query()->whereNotNull('connect_course_id')->firstOrFail();
        $class->update(['connect_course_id' => null]);

        $student = ConnectStudent::query()->where('connect_class_id', $class->id)->first();
        $this->assertNotNull($student);
        $person = HubPerson::query()->findOrFail($student->hub_person_id);

        DB::table('connect_course_hub_person')
            ->where('connect_course_id', $course->id)
            ->where('hub_person_id', $person->id)
            ->delete();

        $this->actingAs($admin)
            ->postJson("/api/connect/courses/{$course->id}/roster/from-class", [
                'connect_class_id' => $class->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.enrolled', 1);

        $this->assertDatabaseHas('connect_classes', [
            'id' => $class->id,
            'connect_course_id' => $course->id,
        ]);

        $this->assertDatabaseHas('connect_course_hub_person', [
            'connect_course_id' => $course->id,
            'hub_person_id' => $person->id,
            'role' => 'student',
        ]);
    }

    public function test_cannot_enroll_class_linked_to_another_course(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $class = ConnectClass::query()->whereNotNull('connect_course_id')->firstOrFail();
        $otherCourse = ConnectCourse::query()->where('id', '!=', $class->connect_course_id)->firstOrFail();

        $this->actingAs($admin)
            ->postJson("/api/connect/courses/{$otherCourse->id}/roster/from-class", [
                'connect_class_id' => $class->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['connect_class_id']);
    }
}
