<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\User;
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

        $permissions = [
            'admin@senaihub.local' => [$connect->id, $grid->id],
            'maria.aluno@senai.local' => [$connect->id],
            'carlos.professor@senai.local' => [$connect->id],
            'ana.grid@senai.local' => [$connect->id, $grid->id],
        ];

        foreach ($permissions as $email => $applicationIds) {
            $user = User::query()->where('email', $email)->first();

            if ($user) {
                $user->applications()->sync($applicationIds);
            }
        }
    }
}
