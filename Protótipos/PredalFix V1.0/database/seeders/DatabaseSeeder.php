<?php

namespace Database\Seeders;

use App\Models\Chamado;
use App\Models\Estoque;
use App\Models\Lead;
use App\Models\Tarefa;
use App\Models\User;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $usuarios = collect([
            ['nome' => 'Bruno Martins', 'email' => 'bruno@predialfix.com', 'cpf' => '111.111.111-11', 'perfil_acesso' => 'admin'],
            ['nome' => 'Ana Souza', 'email' => 'ana@predialfix.com', 'cpf' => '222.222.222-22', 'perfil_acesso' => 'gerente'],
            ['nome' => 'Carlos Lima', 'email' => 'carlos@predialfix.com', 'cpf' => '333.333.333-33', 'perfil_acesso' => 'atendente'],
            ['nome' => 'Marina Costa', 'email' => 'marina@predialfix.com', 'cpf' => '444.444.444-44', 'perfil_acesso' => 'manutencao'],
        ])->map(function (array $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['nome'],
                    'cpf' => $data['cpf'],
                    'tipo' => $data['perfil_acesso'] === 'admin' ? 'admin' : 'colaborador',
                    'ativo' => true,
                    'password' => Hash::make('password'),
                ],
            );

            $usuario = Usuario::firstOrNew(['email' => $data['email']]);
            $usuario->forceFill([
                'id' => $usuario->exists ? $usuario->id : $user->id,
                'nome' => $data['nome'],
                'email' => $data['email'],
                'cpf' => $data['cpf'],
                'password' => Hash::make('password'),
                'perfil_acesso' => $data['perfil_acesso'],
                'ativo' => true,
            ])->save();

            return $usuario->fresh();
        });

        $admin = $usuarios->first();
        $atendente = $usuarios->get(2);
        $manutencao = $usuarios->get(3);

        $chamados = [
            ['titulo' => 'Reparo Tubulação', 'local' => 'Bloco A, Corredor', 'prioridade' => 'Urgente', 'status' => 'Aberto', 'descricao' => 'Vazamento identificado no corredor principal.'],
            ['titulo' => 'Inspeção Elétrica', 'local' => 'Sala 20', 'prioridade' => 'Alta', 'status' => 'Em Análise', 'descricao' => 'Avaliar instabilidade no quadro elétrico.'],
            ['titulo' => 'Conserto Janela', 'local' => 'Sala 20', 'prioridade' => 'Média', 'status' => 'Aberto', 'descricao' => 'Janela lateral com dificuldade de fechamento.'],
            ['titulo' => 'Troca Lâmpada', 'local' => 'Sala 20', 'prioridade' => 'Baixa', 'status' => 'Fechado', 'descricao' => 'Substituição concluída em luminária central.'],
        ];

        foreach ($chamados as $index => $data) {
            Chamado::updateOrCreate(
                ['titulo' => $data['titulo'], 'local' => $data['local']],
                $data + [
                    'id_usuario' => $admin->id,
                    'id_atendente' => $index % 2 === 0 ? $atendente->id : $manutencao->id,
                ],
            );
        }

        $tarefas = [
            ['titulo' => 'Consertar Ar-Condicionado', 'localizacao' => 'Corredor 3', 'prioridade' => 'Alta', 'status' => 'Pendente', 'data_inicio' => now()->subDay(), 'data_final' => now()->addDay()],
            ['titulo' => 'Inspeção Mecânica', 'localizacao' => 'Sala 20', 'prioridade' => 'Média', 'status' => 'Em Andamento', 'data_inicio' => now(), 'data_final' => now()->addDays(2)],
            ['titulo' => 'Ajustar Porta de Acesso', 'localizacao' => 'Bloco C', 'prioridade' => 'Baixa', 'status' => 'Concluído', 'data_inicio' => now()->subDays(3), 'data_final' => now()->subDay()],
        ];

        foreach ($tarefas as $index => $data) {
            Tarefa::updateOrCreate(
                ['titulo' => $data['titulo'], 'localizacao' => $data['localizacao']],
                $data + ['id_responsavel' => $index === 1 ? $atendente->id : $manutencao->id],
            );
        }

        foreach ([
            ['nome' => 'Rolamento', 'categoria' => 'Mecanico', 'localizacao' => 'Almoxarifado', 'quantidade' => 60],
            ['nome' => 'Lâmpada LED', 'categoria' => 'Eletrico', 'localizacao' => 'Depósito 1', 'quantidade' => 24],
            ['nome' => 'Tinta Acrílica', 'categoria' => 'Pintura', 'localizacao' => 'Depósito 2', 'quantidade' => 8],
            ['nome' => 'Disjuntor', 'categoria' => 'Eletrico', 'localizacao' => 'Almoxarifado', 'quantidade' => 3],
        ] as $item) {
            Estoque::updateOrCreate(
                ['nome' => $item['nome'], 'localizacao' => $item['localizacao']],
                $item,
            );
        }

        Lead::updateOrCreate([
            'email' => 'contato@senai.br',
        ], [
            'nome' => 'Contato SENAI',
            'telefone' => '(11) 99999-9999',
            'tipo_imovel' => 'comercial',
            'mensagem' => 'Solicitação de demonstração da plataforma.',
            'status' => 'novo',
            'origem' => 'landing',
        ]);
    }
}
