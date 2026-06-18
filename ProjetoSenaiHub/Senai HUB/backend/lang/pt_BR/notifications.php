<?php

return [
    'action' => [
        'open' => 'Abrir no sistema',
    ],

    'hub.user.created' => [
        'title' => 'Conta criada no SENAI HUB',
        'message' => 'Seu acesso foi configurado. Faça login e confira seus módulos disponíveis.',
    ],
    'hub.user.created_admin' => [
        'title' => 'Novo usuário cadastrado',
        'message' => ':name (:email) foi adicionado ao sistema.',
    ],
    'hub.user.role_updated' => [
        'title' => 'Perfil de acesso atualizado',
        'message' => 'Suas permissões ou cargo foram alterados por um administrador.',
    ],
    'hub.auth.password_changed' => [
        'title' => 'Senha alterada',
        'message' => 'Sua senha foi atualizada com sucesso. Se não foi você, avise o administrador.',
    ],
    'hub.access_request' => [
        'title' => 'Nova solicitação de acesso',
        'message' => ':summary',
    ],

    'connect.student.enrolled' => [
        'title' => 'Matrícula confirmada',
        'message' => 'Você foi matriculado na turma :className.',
    ],
    'connect.student.enrolled_teacher' => [
        'title' => 'Novo aluno na turma',
        'message' => ':studentName entrou na turma :className.',
    ],
    'connect.student.enrolled_staff' => [
        'title' => 'Aluno matriculado',
        'message' => ':studentName cadastrado :classSuffix.',
    ],
    'connect.class.teacher_assigned' => [
        'title' => 'Turma atribuída a você',
        'message' => 'Você foi definido como professor da turma :className.',
    ],
    'connect.class.updated' => [
        'title' => 'Turma atualizada',
        'message' => 'A turma :className teve professor ou curso atualizado.',
    ],
    'connect.course.roster_added' => [
        'title' => 'Vínculo ao curso',
        'message' => 'Você foi adicionado ao curso :courseName como :role.',
    ],
    'connect.calendar.lesson_scheduled' => [
        'title' => 'Aula agendada — :className',
        'message' => 'Aula em :date das :startTime às :endTime — :subject.',
    ],
    'connect.calendar.lesson_cancelled' => [
        'title' => 'Aula cancelada',
        'message' => 'A aula de :date da turma :className foi cancelada.',
    ],
    'connect.calendar.schedule_generated' => [
        'title' => 'Calendário atualizado',
        'message' => ':count aula(s) gerada(s) para a turma :className.',
    ],
    'connect.attendance.high_absence' => [
        'title' => 'Alta taxa de faltas',
        'message' => 'Chamada :date da turma :classCode: :absentRate% de faltas.',
    ],
    'connect.attendance.limit_warning' => [
        'title' => 'Atenção ao limite de faltas',
        'message' => 'Restam :remaining falta(s) permitidas na turma :className.',
    ],
    'connect.contract.created' => [
        'title' => 'Novo contrato registrado',
        'message' => 'Contrato com :companyName cadastrado no sistema.',
    ],
    'connect.contract.created_staff' => [
        'title' => 'Contrato cadastrado',
        'message' => 'Contrato de :studentName com :companyName.',
    ],

    'grid.ticket.created' => [
        'title' => 'Novo chamado:urgentSuffix',
        'message' => ':code: :title — solicitante :requester.',
    ],
    'grid.ticket.assigned' => [
        'title' => 'Chamado atribuído a você',
        'message' => ':code: :title',
    ],
    'grid.ticket.status_changed' => [
        'title' => 'Status do chamado alterado',
        'message' => ':code agora está em :status.',
    ],
    'grid.ticket.status_requester' => [
        'title' => 'Atualização do seu chamado',
        'message' => ':code: :title — status :status.',
    ],
    'grid.ticket.awaiting_evaluation' => [
        'title' => 'Chamado aguardando sua avaliação',
        'message' => ':code: :title',
    ],
    'grid.task.assigned' => [
        'title' => 'Tarefa atribuída a você',
        'message' => ':code: :title',
    ],
    'grid.task.completed' => [
        'title' => 'Tarefa concluída',
        'message' => ':code: :title',
    ],
    'grid.inventory.low_stock' => [
        'title' => 'Estoque baixo',
        'message' => ':itemTitle: disponível :qtyAvailable (mínimo :qtyMin).',
    ],

    'spreadsheet.import_finished' => [
        'title' => ':successTitle',
        'message' => ':spreadsheetKey: :processed registro(s) processado(s):errorSuffix',
    ],
];
