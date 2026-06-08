<?php

/**
 * Perfis de acesso do SENAI HUB.
 * Admin possui todas as permissoes (*).
 * Usuarios novos iniciam como unassigned (sem acesso).
 * custom_permissions no usuario substitui o pacote padrao do perfil quando preenchido.
 */
return [
    'roles' => [
        'admin' => [
            'label' => 'Administrador',
            'module' => 'hub',
            'description' => 'Acesso total ao sistema e gestao de usuarios.',
        ],
        'unassigned' => [
            'label' => 'Sem acesso configurado',
            'module' => 'hub',
            'description' => 'Usuario criado aguardando definicao de modulo e permissoes.',
            'assignable' => false,
        ],
        'connect_professor' => [
            'label' => 'Professor (Connect)',
            'module' => 'connect',
            'description' => 'Alunos, turmas e frequencia do seu contexto.',
        ],
        'connect_secretaria' => [
            'label' => 'Secretaria (Connect)',
            'module' => 'connect',
            'description' => 'Cadastros academicos e operacao do Connect.',
        ],
        'connect_diretor' => [
            'label' => 'Diretor (Connect)',
            'module' => 'connect',
            'description' => 'Visao ampla de pessoas, turmas, relatorios e contratos.',
        ],
        'connect_aqv' => [
            'label' => 'AQV (Connect)',
            'module' => 'connect',
            'description' => 'Indicadores, relatorios e acompanhamento de qualidade.',
        ],
        'connect_empresa' => [
            'label' => 'Empresa parceira (Connect)',
            'module' => 'connect',
            'description' => 'Alunos e contratos vinculados a empresa.',
        ],
        'connect_aluno' => [
            'label' => 'Aluno (Connect)',
            'module' => 'connect',
            'description' => 'Consulta de turmas, frequencia e contratos proprios.',
        ],
        'grid_chefe' => [
            'label' => 'Gerente de manutencao (Grid)',
            'module' => 'grid',
            'description' => 'Gestao completa de chamados, equipe e estoque.',
        ],
        'grid_funcionario' => [
            'label' => 'Tecnico de manutencao (Grid)',
            'module' => 'grid',
            'description' => 'Chamados e tarefas delegados ao tecnico.',
        ],
        'grid_professor' => [
            'label' => 'Professor (Grid)',
            'module' => 'grid',
            'description' => 'Abertura e acompanhamento dos proprios chamados.',
        ],
        'grid_secretaria' => [
            'label' => 'Secretaria (Grid)',
            'module' => 'grid',
            'description' => 'Abertura e acompanhamento dos proprios chamados.',
        ],
    ],

    /**
     * Abas disponiveis por modulo (usadas na customizacao de usuario).
     */
    'nav_permissions' => [
        'connect' => [
            ['key' => 'connect.dashboard', 'label' => 'Visao Geral', 'group' => 'Visao'],
            ['key' => 'connect.people.manage', 'label' => 'Pessoas', 'group' => 'Cadastros'],
            ['key' => 'connect.students.view', 'label' => 'Alunos', 'group' => 'Cadastros'],
            ['key' => 'connect.teachers.view', 'label' => 'Professores', 'group' => 'Cadastros'],
            ['key' => 'connect.classes.view', 'label' => 'Turmas', 'group' => 'Cadastros'],
            ['key' => 'connect.courses.view', 'label' => 'Cursos', 'group' => 'Cadastros'],
            ['key' => 'connect.calendar.view', 'label' => 'Calendario', 'group' => 'Operacao'],
            ['key' => 'connect.attendance.view', 'label' => 'Frequencia', 'group' => 'Operacao'],
            ['key' => 'connect.attendance.manage', 'label' => 'Gerenciar Frequencia', 'group' => 'Operacao'],
            ['key' => 'connect.reports.view', 'label' => 'Relatorio', 'group' => 'Operacao'],
            ['key' => 'connect.location.view', 'label' => 'Localizacao', 'group' => 'Operacao'],
            ['key' => 'connect.spreadsheets', 'label' => 'Planilhas', 'group' => 'Operacao'],
            ['key' => 'connect.contracts.view', 'label' => 'Contratos', 'group' => 'Contratos'],
            ['key' => 'connect.salary.view', 'label' => 'Salario', 'group' => 'Contratos'],
        ],
        'grid' => [
            ['key' => 'grid.dashboard', 'label' => 'Dashboard', 'group' => 'Visao'],
            ['key' => 'grid.controle', 'label' => 'Controle', 'group' => 'Chamados'],
            ['key' => 'grid.tickets.view', 'label' => 'Chamados', 'group' => 'Chamados'],
            ['key' => 'grid.tickets.manage', 'label' => 'Gerenciar Chamados', 'group' => 'Chamados'],
            ['key' => 'grid.tasks.manage', 'label' => 'Tarefas', 'group' => 'Chamados'],
            ['key' => 'grid.reports.view', 'label' => 'Relatorios', 'group' => 'Visao'],
            ['key' => 'grid.inventory.view', 'label' => 'Estoque', 'group' => 'Recursos'],
            ['key' => 'grid.tasks.map', 'label' => 'Mapa', 'group' => 'Recursos'],
            ['key' => 'grid.spreadsheets', 'label' => 'Planilhas', 'group' => 'Recursos'],
            ['key' => 'grid.users.manage', 'label' => 'Usuarios Grid', 'group' => 'Equipe'],
        ],
    ],

    'role_permissions' => [
        'admin' => ['*'],

        'unassigned' => [],

        'connect_professor' => [
            'connect.access',
            'connect.dashboard',
            'connect.students.view',
            'connect.classes.view',
            'connect.courses.view',
            'connect.calendar.view',
            'connect.attendance.view',
            'connect.attendance.manage',
            'connect.reports.view',
            'connect.location.view',
            'connect.spreadsheets',
        ],

        'connect_secretaria' => [
            'connect.access',
            'connect.dashboard',
            'connect.students.manage',
            'connect.teachers.manage',
            'connect.classes.manage',
            'connect.courses.manage',
            'connect.calendar.view',
            'connect.calendar.manage',
            'connect.attendance.view',
            'connect.attendance.manage',
            'connect.reports.view',
            'connect.location.view',
            'connect.spreadsheets',
        ],

        'connect_diretor' => [
            'connect.access',
            'connect.dashboard',
            'connect.people.manage',
            'connect.students.view',
            'connect.teachers.view',
            'connect.classes.view',
            'connect.courses.view',
            'connect.calendar.view',
            'connect.reports.view',
            'connect.location.view',
            'connect.spreadsheets',
            'connect.contracts.view',
        ],

        'connect_aqv' => [
            'connect.access',
            'connect.dashboard',
            'connect.students.view',
            'connect.teachers.view',
            'connect.classes.view',
            'connect.courses.view',
            'connect.calendar.view',
            'connect.reports.view',
            'connect.location.view',
            'connect.spreadsheets',
            'connect.contracts.view',
        ],

        'connect_empresa' => [
            'connect.access',
            'connect.dashboard',
            'connect.students.view',
            'connect.courses.view',
            'connect.attendance.view',
            'connect.reports.view',
            'connect.contracts.view',
            'connect.salary.view',
        ],

        'connect_aluno' => [
            'connect.access',
            'connect.dashboard',
            'connect.teachers.view',
            'connect.classes.view',
            'connect.courses.view',
            'connect.calendar.view',
            'connect.attendance.view_own',
            'connect.location.view',
            'connect.contracts.view_own',
            'connect.salary.view_own',
        ],

        'grid_chefe' => [
            'grid.access',
            'grid.dashboard',
            'grid.controle',
            'grid.tickets.view',
            'grid.tickets.manage',
            'grid.tasks.manage',
            'grid.reports.view',
            'grid.inventory.manage',
            'grid.tasks.map',
            'grid.spreadsheets',
            'grid.users.manage',
        ],

        'grid_funcionario' => [
            'grid.access',
            'grid.tickets.view',
            'grid.tickets.update',
            'grid.tasks.manage',
            'grid.inventory.view',
            'grid.tasks.map',
        ],

        'grid_professor' => [
            'grid.access',
            'grid.tickets.view',
            'grid.tickets.manage',
            'grid.tasks.manage',
        ],

        'grid_secretaria' => [
            'grid.access',
            'grid.tickets.view',
            'grid.tickets.manage',
            'grid.tasks.manage',
        ],
    ],

    'application_slugs_by_role' => [
        'admin' => ['connect', 'grid'],
        'unassigned' => [],
        'connect_professor' => ['connect'],
        'connect_secretaria' => ['connect'],
        'connect_diretor' => ['connect'],
        'connect_aqv' => ['connect'],
        'connect_empresa' => ['connect'],
        'connect_aluno' => ['connect'],
        'grid_chefe' => ['grid'],
        'grid_funcionario' => ['grid'],
        'grid_professor' => ['grid'],
        'grid_secretaria' => ['grid'],
    ],
];
