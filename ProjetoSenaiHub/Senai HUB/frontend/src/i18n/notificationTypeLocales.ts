// Mirrors backend lang notification strings for in-app rendering.
export const notificationTypeLocales = {
  pt: {
    notificationTypes: {
      'hub.user.created': {
        title: 'Conta criada no SENAI HUB',
        message: 'Seu acesso foi configurado. Faça login e confira seus módulos disponíveis.',
      },
      'hub.user.created_admin': {
        title: 'Novo usuário cadastrado',
        message: '{{name}} ({{email}}) foi adicionado ao sistema.',
      },
      'hub.user.role_updated': {
        title: 'Perfil de acesso atualizado',
        message: 'Suas permissões ou cargo foram alterados por um administrador.',
      },
      'hub.auth.password_changed': {
        title: 'Senha alterada',
        message: 'Sua senha foi atualizada com sucesso. Se não foi você, avise o administrador.',
      },
      'hub.access_request': {
        title: 'Nova solicitação de acesso',
        message: '{{summary}}',
      },
      'connect.student.enrolled': {
        title: 'Matrícula confirmada',
        message: 'Você foi matriculado na turma {{className}}.',
      },
      'connect.student.enrolled_teacher': {
        title: 'Novo aluno na turma',
        message: '{{studentName}} entrou na turma {{className}}.',
      },
      'connect.student.enrolled_staff': {
        title: 'Aluno matriculado',
        message: '{{studentName}} cadastrado {{classSuffix}}.',
      },
      'connect.class.teacher_assigned': {
        title: 'Turma atribuída a você',
        message: 'Você foi definido como professor da turma {{className}}.',
      },
      'connect.class.updated': {
        title: 'Turma atualizada',
        message: 'A turma {{className}} teve professor ou curso atualizado.',
      },
      'connect.course.roster_added': {
        title: 'Vínculo ao curso',
        message: 'Você foi adicionado ao curso {{courseName}} como {{role}}.',
      },
      'connect.calendar.lesson_scheduled': {
        title: 'Aula agendada — {{className}}',
        message: 'Aula em {{date}} das {{startTime}} às {{endTime}} — {{subject}}.',
      },
      'connect.calendar.lesson_cancelled': {
        title: 'Aula cancelada',
        message: 'A aula de {{date}} da turma {{className}} foi cancelada.',
      },
      'connect.calendar.schedule_generated': {
        title: 'Calendário atualizado',
        message: '{{count}} aula(s) gerada(s) para a turma {{className}}.',
      },
      'connect.attendance.high_absence': {
        title: 'Alta taxa de faltas',
        message: 'Chamada {{date}} da turma {{classCode}}: {{absentRate}}% de faltas.',
      },
      'connect.attendance.limit_warning': {
        title: 'Atenção ao limite de faltas',
        message: 'Restam {{remaining}} falta(s) permitidas na turma {{className}}.',
      },
      'connect.contract.created': {
        title: 'Novo contrato registrado',
        message: 'Contrato com {{companyName}} cadastrado no sistema.',
      },
      'connect.contract.created_staff': {
        title: 'Contrato cadastrado',
        message: 'Contrato de {{studentName}} com {{companyName}}.',
      },
      'grid.ticket.created': {
        title: 'Novo chamado{{urgentSuffix}}',
        message: '{{code}}: {{title}} — solicitante {{requester}}.',
      },
      'grid.ticket.assigned': {
        title: 'Chamado atribuído a você',
        message: '{{code}}: {{title}}',
      },
      'grid.ticket.status_changed': {
        title: 'Status do chamado alterado',
        message: '{{code}} agora está em {{status}}.',
      },
      'grid.ticket.status_requester': {
        title: 'Atualização do seu chamado',
        message: '{{code}}: {{title}} — status {{status}}.',
      },
      'grid.ticket.awaiting_evaluation': {
        title: 'Chamado aguardando sua avaliação',
        message: '{{code}}: {{title}}',
      },
      'grid.task.assigned': {
        title: 'Tarefa atribuída a você',
        message: '{{code}}: {{title}}',
      },
      'grid.task.completed': {
        title: 'Tarefa concluída',
        message: '{{code}}: {{title}}',
      },
      'grid.inventory.low_stock': {
        title: 'Estoque baixo',
        message: '{{itemTitle}}: disponível {{qtyAvailable}} (mínimo {{qtyMin}}).',
      },
      'spreadsheet.import_finished': {
        title: '{{successTitle}}',
        message: '{{spreadsheetKey}}: {{processed}} registro(s) processado(s){{errorSuffix}}',
      },
    },
  },
  en: {
    notificationTypes: {
      'hub.user.created': {
        title: 'SENAI HUB account created',
        message: 'Your access has been configured. Sign in and review your available modules.',
      },
      'hub.user.created_admin': {
        title: 'New user registered',
        message: '{{name}} ({{email}}) was added to the system.',
      },
      'hub.user.role_updated': {
        title: 'Access profile updated',
        message: 'Your permissions or role were changed by an administrator.',
      },
      'hub.auth.password_changed': {
        title: 'Password changed',
        message: 'Your password was updated successfully. If this was not you, contact an administrator.',
      },
      'hub.access_request': {
        title: 'New access request',
        message: '{{summary}}',
      },
      'connect.student.enrolled': {
        title: 'Enrollment confirmed',
        message: 'You were enrolled in class {{className}}.',
      },
      'connect.student.enrolled_teacher': {
        title: 'New student in class',
        message: '{{studentName}} joined class {{className}}.',
      },
      'connect.student.enrolled_staff': {
        title: 'Student enrolled',
        message: '{{studentName}} registered {{classSuffix}}.',
      },
      'connect.class.teacher_assigned': {
        title: 'Class assigned to you',
        message: 'You were set as teacher for class {{className}}.',
      },
      'connect.class.updated': {
        title: 'Class updated',
        message: 'Class {{className}} had teacher or course updated.',
      },
      'connect.course.roster_added': {
        title: 'Course enrollment',
        message: 'You were added to course {{courseName}} as {{role}}.',
      },
      'connect.calendar.lesson_scheduled': {
        title: 'Lesson scheduled — {{className}}',
        message: 'Lesson on {{date}} from {{startTime}} to {{endTime}} — {{subject}}.',
      },
      'connect.calendar.lesson_cancelled': {
        title: 'Lesson cancelled',
        message: 'The lesson on {{date}} for class {{className}} was cancelled.',
      },
      'connect.calendar.schedule_generated': {
        title: 'Calendar updated',
        message: '{{count}} lesson(s) generated for class {{className}}.',
      },
      'connect.attendance.high_absence': {
        title: 'High absence rate',
        message: 'Roll call {{date}} for class {{classCode}}: {{absentRate}}% absences.',
      },
      'connect.attendance.limit_warning': {
        title: 'Absence limit warning',
        message: '{{remaining}} absence(s) remaining for class {{className}}.',
      },
      'connect.contract.created': {
        title: 'New contract registered',
        message: 'Contract with {{companyName}} registered in the system.',
      },
      'connect.contract.created_staff': {
        title: 'Contract registered',
        message: 'Contract for {{studentName}} with {{companyName}}.',
      },
      'grid.ticket.created': {
        title: 'New ticket{{urgentSuffix}}',
        message: '{{code}}: {{title}} — requester {{requester}}.',
      },
      'grid.ticket.assigned': {
        title: 'Ticket assigned to you',
        message: '{{code}}: {{title}}',
      },
      'grid.ticket.status_changed': {
        title: 'Ticket status changed',
        message: '{{code}} is now {{status}}.',
      },
      'grid.ticket.status_requester': {
        title: 'Your ticket was updated',
        message: '{{code}}: {{title}} — status {{status}}.',
      },
      'grid.ticket.awaiting_evaluation': {
        title: 'Ticket awaiting your evaluation',
        message: '{{code}}: {{title}}',
      },
      'grid.task.assigned': {
        title: 'Task assigned to you',
        message: '{{code}}: {{title}}',
      },
      'grid.task.completed': {
        title: 'Task completed',
        message: '{{code}}: {{title}}',
      },
      'grid.inventory.low_stock': {
        title: 'Low stock',
        message: '{{itemTitle}}: {{qtyAvailable}} available (minimum {{qtyMin}}).',
      },
      'spreadsheet.import_finished': {
        title: '{{successTitle}}',
        message: '{{spreadsheetKey}}: {{processed}} record(s) processed{{errorSuffix}}',
      },
    },
  },
  es: {
    notificationTypes: {
      'hub.user.created': {
        title: 'Cuenta creada en SENAI HUB',
        message: 'Su acceso fue configurado. Inicie sesión y revise sus módulos disponibles.',
      },
      'hub.user.created_admin': {
        title: 'Nuevo usuario registrado',
        message: '{{name}} ({{email}}) fue agregado al sistema.',
      },
      'hub.user.role_updated': {
        title: 'Perfil de acceso actualizado',
        message: 'Sus permisos o cargo fueron modificados por un administrador.',
      },
      'hub.auth.password_changed': {
        title: 'Contraseña cambiada',
        message: 'Su contraseña se actualizó correctamente. Si no fue usted, avise al administrador.',
      },
      'hub.access_request': {
        title: 'Nueva solicitud de acceso',
        message: '{{summary}}',
      },
      'connect.student.enrolled': {
        title: 'Matrícula confirmada',
        message: 'Fue matriculado en la clase {{className}}.',
      },
      'connect.student.enrolled_teacher': {
        title: 'Nuevo alumno en la clase',
        message: '{{studentName}} ingresó a la clase {{className}}.',
      },
      'connect.student.enrolled_staff': {
        title: 'Alumno matriculado',
        message: '{{studentName}} registrado {{classSuffix}}.',
      },
      'connect.class.teacher_assigned': {
        title: 'Clase asignada a usted',
        message: 'Fue definido como profesor de la clase {{className}}.',
      },
      'connect.class.updated': {
        title: 'Clase actualizada',
        message: 'La clase {{className}} tuvo profesor o curso actualizado.',
      },
      'connect.course.roster_added': {
        title: 'Vínculo al curso',
        message: 'Fue agregado al curso {{courseName}} como {{role}}.',
      },
      'connect.calendar.lesson_scheduled': {
        title: 'Clase programada — {{className}}',
        message: 'Clase el {{date}} de {{startTime}} a {{endTime}} — {{subject}}.',
      },
      'connect.calendar.lesson_cancelled': {
        title: 'Clase cancelada',
        message: 'La clase del {{date}} de la turma {{className}} fue cancelada.',
      },
      'connect.calendar.schedule_generated': {
        title: 'Calendario actualizado',
        message: '{{count}} clase(s) generada(s) para la turma {{className}}.',
      },
      'connect.attendance.high_absence': {
        title: 'Alta tasa de ausencias',
        message: 'Lista {{date}} de la turma {{classCode}}: {{absentRate}}% de ausencias.',
      },
      'connect.attendance.limit_warning': {
        title: 'Atención al límite de ausencias',
        message: 'Quedan {{remaining}} ausencia(s) permitidas en la turma {{className}}.',
      },
      'connect.contract.created': {
        title: 'Nuevo contrato registrado',
        message: 'Contrato con {{companyName}} registrado en el sistema.',
      },
      'connect.contract.created_staff': {
        title: 'Contrato registrado',
        message: 'Contrato de {{studentName}} con {{companyName}}.',
      },
      'grid.ticket.created': {
        title: 'Nuevo ticket{{urgentSuffix}}',
        message: '{{code}}: {{title}} — solicitante {{requester}}.',
      },
      'grid.ticket.assigned': {
        title: 'Ticket asignado a usted',
        message: '{{code}}: {{title}}',
      },
      'grid.ticket.status_changed': {
        title: 'Estado del ticket cambiado',
        message: '{{code}} ahora está en {{status}}.',
      },
      'grid.ticket.status_requester': {
        title: 'Actualización de su ticket',
        message: '{{code}}: {{title}} — estado {{status}}.',
      },
      'grid.ticket.awaiting_evaluation': {
        title: 'Ticket esperando su evaluación',
        message: '{{code}}: {{title}}',
      },
      'grid.task.assigned': {
        title: 'Tarea asignada a usted',
        message: '{{code}}: {{title}}',
      },
      'grid.task.completed': {
        title: 'Tarea completada',
        message: '{{code}}: {{title}}',
      },
      'grid.inventory.low_stock': {
        title: 'Stock bajo',
        message: '{{itemTitle}}: {{qtyAvailable}} disponible (mínimo {{qtyMin}}).',
      },
      'spreadsheet.import_finished': {
        title: '{{successTitle}}',
        message: '{{spreadsheetKey}}: {{processed}} registro(s) procesado(s){{errorSuffix}}',
      },
    },
  },
} as const
