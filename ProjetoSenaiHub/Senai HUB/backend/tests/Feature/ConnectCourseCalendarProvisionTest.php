<?php

namespace Tests\Feature;

use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectLessonSchedule;
use App\Models\User;
use App\Support\ConnectSemesterDefaults;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConnectCourseCalendarProvisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_course_store_provisions_default_class_and_calendar(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $code = 'CAL'.now()->format('His');

        $response = $this->actingAs($admin)
            ->postJson('/api/connect/courses', [
                'code' => $code,
                'name' => 'Curso Calendario Automatico',
                'workload_hours' => 120,
                'status' => 'active',
            ])
            ->assertCreated();

        $courseId = (int) $response->json('data.id');
        $semester = ConnectSemesterDefaults::currentLabel();
        $period = ConnectSemesterDefaults::periodForDate();

        $course = ConnectCourse::query()->findOrFail($courseId);
        $this->assertSame($period['start'], $course->start_date?->format('Y-m-d'));
        $this->assertSame($period['end'], $course->end_date?->format('Y-m-d'));

        $class = ConnectClass::query()
            ->where('connect_course_id', $courseId)
            ->where('semester', $semester)
            ->first();

        $this->assertNotNull($class);
        $this->assertTrue($class->weeklyPatterns()->exists());

        $lessonsCount = ConnectLessonSchedule::query()
            ->where('connect_class_id', $class->id)
            ->where('status', '!=', 'cancelled')
            ->count();

        $this->assertGreaterThan(0, $lessonsCount);
        $this->assertStringContainsString('Calendario gerado', (string) $response->json('message'));
    }

    public function test_course_update_with_dates_provisions_calendar_when_missing(): void
    {
        $this->seed();

        $admin = User::query()->where('email', 'admin@senaihub.local')->firstOrFail();
        $period = ConnectSemesterDefaults::periodForDate();

        $course = ConnectCourse::query()->create([
            'code' => 'UPD'.now()->format('His'),
            'name' => 'Curso Sem Calendario',
            'workload_hours' => 80,
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->putJson("/api/connect/courses/{$course->id}", [
                'start_date' => $period['start'],
                'end_date' => $period['end'],
            ])
            ->assertOk();

        $this->assertTrue(
            ConnectLessonSchedule::query()
                ->whereHas('connectClass', fn ($query) => $query->where('connect_course_id', $course->id))
                ->where('status', '!=', 'cancelled')
                ->exists()
        );
    }
}
