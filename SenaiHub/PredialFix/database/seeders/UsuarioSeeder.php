<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsuarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Usuario::create([
            'nome' => 'Admin User',
            'email' => 'admin@predialfix.com',
            'cpf' => '12345678901',
            'password' => Hash::make('password'),
            'perfil_acesso' => 'admin',
            'ativo' => true,
        ]);

        Usuario::create([
            'nome' => 'Atendente User',
            'email' => 'atendente@predialfix.com',
            'cpf' => '12345678902',
            'password' => Hash::make('password'),
            'perfil_acesso' => 'atendente',
            'ativo' => true,
        ]);

        Usuario::create([
            'nome' => 'Cliente User',
            'email' => 'cliente@predialfix.com',
            'cpf' => '12345678903',
            'password' => Hash::make('password'),
            'perfil_acesso' => 'cliente',
            'ativo' => true,
        ]);
    }
}
