<?php

namespace Database\Seeders;

use App\Models\Application;
use Illuminate\Database\Seeder;

class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $applications = [
            [
                'slug' => 'connect',
                'name' => 'SENAI Connect',
                'description' => 'Acesse dados educacionais, acompanhe indicadores, cadastros, turmas, cursos, frequencia e muito mais.',
                'route_path' => '/connect',
                'icon' => 'users',
                'sort_order' => 1,
            ],
            [
                'slug' => 'grid',
                'name' => 'SENAI Grid',
                'description' => 'Gerencie ordens de servico, manutencoes, contratos, ativos, chamados e espacos fisicos.',
                'route_path' => '/grid',
                'icon' => 'building',
                'sort_order' => 2,
            ],
        ];

        foreach ($applications as $application) {
            Application::query()->updateOrCreate(
                ['slug' => $application['slug']],
                $application,
            );
        }
    }
}
