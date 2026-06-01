<?php

/**
 * Perfis de acesso do SENAI HUB.
 * Admin possui todas as permissoes (*).
 */
return [
    'roles' => [
        'admin' => [
            'label' => 'Administrador',
            'module' => 'hub',
            'description' => 'Acesso total ao sistema e gestao de usuarios.',
        ],
        'connect_professor' => [
            'label' => 'Professor (Connect)',
            'module' => 'connect',
            'description' => 'Turmas, frequencia e alunos do seu contexto.',
        ],
        'connect_secretaria' => [
            'label' => 'Secretaria (Connect)',
            'module' => 'connect',
            'description' => 'Cadastros academicos, turmas, matriculas e contratos.',
        ],
        'connect_aqv' => [
            'label' => 'AQV (Connect)',
            'module' => 'connect',
            'description' => 'Indicadores, relatorios e acompanhamento de qualidade.',
        ],
        'connect_empresa' => [
            'label' => 'Empresa parceira (Connect)',
            'module' => 'connect',
            'description' => 'Consulta de frequencia dos alunos vinculados a empresa.',
        ],
        'connect_aluno' => [
            'label' => 'Aluno (Connect)',
            'module' => 'connect',
            'description' => 'Consulta da propria frequencia e dados academicos.',
        ],
        'grid_chefe' => [
            'label' => 'Chefe de manutencao (Grid)',
            'module' => 'grid',
            'description' => 'Gestao completa de chamados, equipe e estoque.',
        ],
        'grid_funcionario' => [
            'label' => 'Funcionario de manutencao (Grid)',
            'module' => 'grid',
            'description' => 'Atendimento de chamados e tarefas atribuidas.',
        ],
    ],

    'role_permissions' => [
        'admin' => ['*'],

        'connect_professor' => [
            'connect.access',
            'connect.dashboard',
            'connect.classes.view',
            'connect.students.view',
            'connect.attendance.view',
            'connect.attendance.manage',
            'connect.reports.view',
        ],

        'connect_secretaria' => [
            'connect.access',
            'connect.dashboard',
            'connect.people.manage',
            'connect.students.manage',
            'connect.teachers.manage',
            'connect.classes.manage',
            'connect.courses.manage',
            'connect.contracts.manage',
            'connect.attendance.view',
            'connect.attendance.manage',
            'connect.reports.view',
            'connect.spreadsheets',
            'connect.location.view',
        ],

        'connect_aqv' => [
            'connect.access',
            'connect.dashboard',
            'connect.students.view',
            'connect.classes.view',
            'connect.attendance.view',
            'connect.reports.view',
            'connect.reports.manage',
            'connect.spreadsheets',
        ],

        'connect_empresa' => [
            'connect.access',
            'connect.dashboard',
            'connect.attendance.view',
            'connect.reports.view',
        ],

        'connect_aluno' => [
            'connect.access',
            'connect.dashboard',
            'connect.attendance.view_own',
        ],

        'grid_chefe' => [
            'grid.access',
            'grid.dashboard',
            'grid.tickets.manage',
            'grid.tasks.manage',
            'grid.inventory.manage',
            'grid.users.manage',
            'grid.reports.view',
            'grid.spreadsheets',
        ],

        'grid_funcionario' => [
            'grid.access',
            'grid.dashboard',
            'grid.tickets.view',
            'grid.tickets.update',
            'grid.tasks.manage',
            'grid.inventory.view',
            'grid.reports.view',
        ],
    ],

    'application_slugs_by_role' => [
        'admin' => ['connect', 'grid'],
        'connect_professor' => ['connect'],
        'connect_secretaria' => ['connect'],
        'connect_aqv' => ['connect'],
        'connect_empresa' => ['connect'],
        'connect_aluno' => ['connect'],
        'grid_chefe' => ['grid'],
        'grid_funcionario' => ['grid'],
    ],
];
