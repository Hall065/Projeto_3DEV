<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrador SENAI',
                'email' => 'admin@senaihub.local',
                'password' => 'password',
                'role' => 'admin',
            ],
            [
                'name' => 'Maria Silva',
                'email' => 'maria.aluno@senai.local',
                'password' => 'password123',
                'role' => 'student',
            ],
            [
                'name' => 'Carlos Professor',
                'email' => 'carlos.professor@senai.local',
                'password' => 'password123',
                'role' => 'teacher',
            ],
            [
                'name' => 'Ana Souza',
                'email' => 'ana.grid@senai.local',
                'password' => 'password123',
                'role' => 'staff',
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
