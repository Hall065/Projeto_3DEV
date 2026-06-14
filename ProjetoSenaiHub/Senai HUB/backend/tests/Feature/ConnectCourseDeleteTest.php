<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectCourseDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_course_without_classes(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $course = ConnectCourse::query()->firstOrFail();

        ConnectClass::query()->where('connect_course_id', $course->id)->update(['connect_course_id' => null]);

        $this->actingAs($admin)
            ->deleteJson("/api/connect/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Curso excluído com sucesso.');

        $this->assertDatabaseMissing('connect_courses', ['id' => $course->id]);
    }

    public function test_cannot_delete_course_with_linked_classes(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $class = ConnectClass::query()->whereNotNull('connect_course_id')->firstOrFail();

        $this->actingAs($admin)
            ->deleteJson("/api/connect/courses/{$class->connect_course_id}")
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Não é possível excluir um curso com turmas vinculadas. Remova ou encerre as turmas antes.']);
    }
}
