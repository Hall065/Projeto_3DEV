<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class LandingController extends Controller
{
    public function index(): View
    {
        $diferenciais = [
            [
                'titulo' => 'Resposta Rápida',
                'descricao' => 'Acompanhamento centralizado de chamados com visibilidade de ponta a ponta.',
            ],
            [
                'titulo' => 'Operação Transparente',
                'descricao' => 'Gestores e equipes acompanham prioridades, prazos e evolução em tempo real.',
            ],
            [
                'titulo' => 'Dashboard Gerencial',
                'descricao' => 'Indicadores, agenda e relatórios em um único painel operacional.',
            ],
            [
                'titulo' => 'Controle de Estoque',
                'descricao' => 'Itens críticos, quantidades e status de reposição sempre atualizados.',
            ],
        ];

        $servicos = [
            ['icone' => 'H', 'titulo' => 'Hidráulica', 'descricao' => 'Gestão de manutenção corretiva e preventiva em redes hidráulicas.'],
            ['icone' => 'E', 'titulo' => 'Elétrica', 'descricao' => 'Chamados, inspeções e histórico de intervenções elétricas.'],
            ['icone' => 'P', 'titulo' => 'Pintura', 'descricao' => 'Controle de ordens de serviço para revitalização e acabamento.'],
            ['icone' => 'A', 'titulo' => 'Alvenaria', 'descricao' => 'Demandas estruturais com acompanhamento por prioridade e prazo.'],
            ['icone' => 'J', 'titulo' => 'Jardinagem', 'descricao' => 'Rotinas de conservação externa e manutenção de áreas verdes.'],
            ['icone' => 'L', 'titulo' => 'Limpeza Técnica', 'descricao' => 'Apoio às rotinas operacionais e gestão de atividades recorrentes.'],
        ];

        $passos = [
            ['titulo' => 'Cadastre-se', 'descricao' => 'Crie sua conta e habilite o acesso da unidade ou equipe.'],
            ['titulo' => 'Abra um chamado', 'descricao' => 'Registre a demanda com prioridade, local e descrição detalhada.'],
            ['titulo' => 'Acompanhe a execução', 'descricao' => 'Consulte tarefas, atualizações e status em tempo real.'],
            ['titulo' => 'Analise resultados', 'descricao' => 'Use relatórios e indicadores para decidir com mais velocidade.'],
        ];

        $depoimentos = [
            ['nome' => 'Bruno Almeida', 'cargo' => 'Gestor de Unidade', 'texto' => 'A operação ficou muito mais organizada e o tempo de resposta caiu visivelmente.'],
            ['nome' => 'Marina Souza', 'cargo' => 'Coordenação Regional', 'texto' => 'Hoje temos visão consolidada dos chamados e priorizamos com muito mais clareza.'],
            ['nome' => 'Carlos Nogueira', 'cargo' => 'Prestador', 'texto' => 'O fluxo de tarefas e aprovações ficou simples e direto para a equipe em campo.'],
        ];

        $faqs = [
            ['pergunta' => 'A PredialFix atende múltiplas unidades?', 'resposta' => 'Sim. O fluxo foi pensado para gestão de unidades SENAI com visão consolidada da operação.'],
            ['pergunta' => 'É possível acompanhar chamados e tarefas no mesmo painel?', 'resposta' => 'Sim. Dashboard, chamados, tarefas, estoque e relatórios ficam integrados no portal.'],
            ['pergunta' => 'O sistema possui controle de estoque?', 'resposta' => 'Sim. O módulo de estoque mostra itens, categorias, localização, quantidade e status.'],
            ['pergunta' => 'Existe trilha para gestão e equipe operacional?', 'resposta' => 'Sim. A plataforma contempla papéis distintos e organiza a operação conforme o perfil do usuário.'],
        ];

        $planos = [
            [
                'nome' => 'Básico',
                'preco' => '149',
                'descricao' => 'Ideal para unidades com operação enxuta.',
                'features' => ['Dashboard operacional', 'Chamados e tarefas', 'Controle básico de estoque'],
                'destaque' => false,
            ],
            [
                'nome' => 'Pro',
                'preco' => '249',
                'descricao' => 'Mais completo para gestão ativa.',
                'features' => ['Tudo do Básico', 'Relatórios avançados', 'Fluxo com priorização visual'],
                'destaque' => true,
            ],
            [
                'nome' => 'Enterprise',
                'preco' => 'Sob consulta',
                'descricao' => 'Operação regional com múltiplas unidades.',
                'features' => ['Visão consolidada', 'Suporte dedicado', 'Estrutura personalizada'],
                'destaque' => false,
            ],
        ];

        return view('welcome', compact(
            'diferenciais',
            'servicos',
            'passos',
            'depoimentos',
            'faqs',
            'planos',
        ));
    }
}
