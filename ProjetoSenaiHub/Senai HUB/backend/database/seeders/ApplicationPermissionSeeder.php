<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\User;
use App\Services\Auth\PermissionService;
use App\Support\HubRole;
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

        // Vincular user_id do aluno demo
        $studentUser = User::query()->where('email', 'maria.aluno@senai.local')->first();
        if ($studentUser) {
            \App\Models\Connect\ConnectStudent::query()
                ->where('registration_number', '2025AUT0046')
                ->orWhere('email', 'mariana.coelho@aluno.senai.local')
                ->limit(1)
                ->update(['user_id' => $studentUser->id]);
        }

        $teacherUser = User::query()->where('email', 'carlos.professor@senai.local')->first();
        if ($teacherUser) {
            \App\Models\Connect\ConnectTeacher::query()->orderBy('id')->limit(1)->update(['user_id' => $teacherUser->id]);
        }
    }
}
