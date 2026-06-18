<?php

return [
    'action' => [
        'open' => 'Abrir en el sistema',
    ],

    'hub.user.created' => [
        'title' => 'Cuenta creada en SENAI HUB',
        'message' => 'Su acceso fue configurado. Inicie sesión y revise sus módulos disponibles.',
    ],
    'hub.user.created_admin' => [
        'title' => 'Nuevo usuario registrado',
        'message' => ':name (:email) fue agregado al sistema.',
    ],
    'hub.user.role_updated' => [
        'title' => 'Perfil de acceso actualizado',
        'message' => 'Sus permisos o cargo fueron modificados por un administrador.',
    ],
    'hub.auth.password_changed' => [
        'title' => 'Contraseña cambiada',
        'message' => 'Su contraseña se actualizó correctamente. Si no fue usted, avise al administrador.',
    ],
    'hub.access_request' => [
        'title' => 'Nueva solicitud de acceso',
        'message' => ':summary',
    ],

    'connect.student.enrolled' => [
        'title' => 'Matrícula confirmada',
        'message' => 'Fue matriculado en la clase :className.',
    ],
    'connect.student.enrolled_teacher' => [
        'title' => 'Nuevo alumno en la clase',
        'message' => ':studentName ingresó a la clase :className.',
    ],
    'connect.student.enrolled_staff' => [
        'title' => 'Alumno matriculado',
        'message' => ':studentName registrado :classSuffix.',
    ],
    'connect.class.teacher_assigned' => [
        'title' => 'Clase asignada a usted',
        'message' => 'Fue definido como profesor de la clase :className.',
    ],
    'connect.class.updated' => [
        'title' => 'Clase actualizada',
        'message' => 'La clase :className tuvo profesor o curso actualizado.',
    ],
    'connect.course.roster_added' => [
        'title' => 'Vínculo al curso',
        'message' => 'Fue agregado al curso :courseName como :role.',
    ],
    'connect.calendar.lesson_scheduled' => [
        'title' => 'Clase programada — :className',
        'message' => 'Clase el :date de :startTime a :endTime — :subject.',
    ],
    'connect.calendar.lesson_cancelled' => [
        'title' => 'Clase cancelada',
        'message' => 'La clase del :date de la turma :className fue cancelada.',
    ],
    'connect.calendar.schedule_generated' => [
        'title' => 'Calendario actualizado',
        'message' => ':count clase(s) generada(s) para la turma :className.',
    ],
    'connect.attendance.high_absence' => [
        'title' => 'Alta tasa de ausencias',
        'message' => 'Lista :date de la turma :classCode: :absentRate% de ausencias.',
    ],
    'connect.attendance.limit_warning' => [
        'title' => 'Atención al límite de ausencias',
        'message' => 'Quedan :remaining ausencia(s) permitidas en la turma :className.',
    ],
    'connect.contract.created' => [
        'title' => 'Nuevo contrato registrado',
        'message' => 'Contrato con :companyName registrado en el sistema.',
    ],
    'connect.contract.created_staff' => [
        'title' => 'Contrato registrado',
        'message' => 'Contrato de :studentName con :companyName.',
    ],

    'grid.ticket.created' => [
        'title' => 'Nuevo ticket:urgentSuffix',
        'message' => ':code: :title — solicitante :requester.',
    ],
    'grid.ticket.assigned' => [
        'title' => 'Ticket asignado a usted',
        'message' => ':code: :title',
    ],
    'grid.ticket.status_changed' => [
        'title' => 'Estado del ticket cambiado',
        'message' => ':code ahora está en :status.',
    ],
    'grid.ticket.status_requester' => [
        'title' => 'Actualización de su ticket',
        'message' => ':code: :title — estado :status.',
    ],
    'grid.ticket.awaiting_evaluation' => [
        'title' => 'Ticket esperando su evaluación',
        'message' => ':code: :title',
    ],
    'grid.task.assigned' => [
        'title' => 'Tarea asignada a usted',
        'message' => ':code: :title',
    ],
    'grid.task.completed' => [
        'title' => 'Tarea completada',
        'message' => ':code: :title',
    ],
    'grid.inventory.low_stock' => [
        'title' => 'Stock bajo',
        'message' => ':itemTitle: :qtyAvailable disponible (mínimo :qtyMin).',
    ],

    'spreadsheet.import_finished' => [
        'title' => ':successTitle',
        'message' => ':spreadsheetKey: :processed registro(s) procesado(s):errorSuffix',
    ],
];
