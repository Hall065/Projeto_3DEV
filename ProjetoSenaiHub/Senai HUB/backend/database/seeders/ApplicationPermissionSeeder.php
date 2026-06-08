<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\User;
use App\Services\Auth\PermissionService;
use Illuminate\Database\Seeder;

class ApplicationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $connect = Application::query()->where('slug', 'connect')->first();
        $grid = Application::query()->where('slug', 'grid')->first();

        if (! $connect || ! $grid) {
            return;
        }

        $permissions = app(PermissionService::class);

        foreach (User::query()->cursor() as $user) {
            $slugs = $permissions->applicationSlugsFor($user);
            $ids = collect([$connect, $grid])
                ->filter(fn (Application $app) => in_array($app->slug, $slugs, true))
                ->pluck('id');
            $user->applications()->sync($ids);
        }

        $this->linkConnectStudentUser('maria.aluno@senai.local', '2025AUT0003');
        $this->linkConnectStudentUser('joao.aluno@senai.local', '2025AUT0021');

        $this->linkConnectTeacherUser('carlos.professor@senai.local', 'carlos.professor@senai.local');
        $this->linkConnectTeacherUser('patricia.professor@senai.local', 'patricia.professor@senai.local');
    }

    private function linkConnectStudentUser(string $userEmail, string $registrationNumber): void
    {
        $user = User::query()->where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        $student = \App\Models\Connect\ConnectStudent::query()
            ->where('registration_number', $registrationNumber)
            ->first();

        if (! $student) {
            return;
        }

        $student->update(['user_id' => $user->id]);
        if ($student->hub_person_id) {
            \App\Models\HubPerson::query()
                ->whereKey($student->hub_person_id)
                ->update(['user_id' => $user->id]);
        }
    }

    private function linkConnectTeacherUser(string $userEmail, string $teacherEmail): void
    {
        $user = User::query()->where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        \App\Models\Connect\ConnectTeacher::query()
            ->where('email', $teacherEmail)
            ->update(['user_id' => $user->id]);
    }
}
