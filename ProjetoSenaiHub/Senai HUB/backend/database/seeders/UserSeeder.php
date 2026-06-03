<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\HubRole;
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
                'role' => HubRole::ADMIN,
            ],
            [
                'name' => 'Carlos Professor',
                'email' => 'carlos.professor@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_PROFESSOR,
            ],
            [
                'name' => 'Patricia Professor',
                'email' => 'patricia.professor@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_PROFESSOR,
            ],
            [
                'name' => 'Fernanda Secretaria',
                'email' => 'fernanda.secretaria@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_SECRETARIA,
            ],
            [
                'name' => 'Luciana Secretaria',
                'email' => 'luciana.secretaria@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_SECRETARIA,
            ],
            [
                'name' => 'Ricardo AQV',
                'email' => 'ricardo.aqv@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_AQV,
            ],
            [
                'name' => 'Simone AQV',
                'email' => 'simone.aqv@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_AQV,
            ],
            [
                'name' => 'Maria Silva',
                'email' => 'maria.aluno@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_ALUNO,
            ],
            [
                'name' => 'Joao Aluno',
                'email' => 'joao.aluno@senai.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_ALUNO,
            ],
            [
                'name' => 'Industria ABC',
                'email' => 'empresa.abc@parceiro.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_EMPRESA,
                'company_name' => 'Indústria Metalúrgica ABC',
            ],
            [
                'name' => 'MetalTech Parceira',
                'email' => 'empresa.metaltech@parceiro.local',
                'password' => 'password123',
                'role' => HubRole::CONNECT_EMPRESA,
                'company_name' => 'MetalTech Indústria',
            ],
            [
                'name' => 'Joao Chefe Manutencao',
                'email' => 'joao.chefe@grid.senai.local',
                'password' => 'password123',
                'role' => HubRole::GRID_CHEFE,
            ],
            [
                'name' => 'Carlos Chefe Manutencao',
                'email' => 'carlos.chefe@grid.senai.local',
                'password' => 'password123',
                'role' => HubRole::GRID_CHEFE,
            ],
            [
                'name' => 'Pedro Tecnico',
                'email' => 'pedro.tecnico@grid.senai.local',
                'password' => 'password123',
                'role' => HubRole::GRID_FUNCIONARIO,
            ],
            [
                'name' => 'Julia Tecnica',
                'email' => 'julia.tecnica@grid.senai.local',
                'password' => 'password123',
                'role' => HubRole::GRID_FUNCIONARIO,
            ],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($user['password']),
                    'role' => $user['role'],
                    'company_name' => $user['company_name'] ?? null,
                    'email_verified_at' => now(),
                ],
            );
        }
    }
}
