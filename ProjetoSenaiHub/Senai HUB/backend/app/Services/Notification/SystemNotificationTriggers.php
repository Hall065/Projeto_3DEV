<?php

namespace App\Services\Notification;

use App\Models\AccessRequest;
use App\Models\Connect\ConnectAttendanceSession;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectLessonSchedule;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\Grid\GridInventoryItem;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\HubPerson;
use App\Models\SpreadsheetImportLog;
use App\Models\User;
use App\Support\ConnectAttendanceStats;
use App\Support\HubRole;

class SystemNotificationTriggers
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public function userCreated(User $user, ?User $actor = null): void
    {
        $this->notifications->notify($user, [
            'module' => 'hub',
            'type' => 'hub.user.created',
            'title' => 'Conta criada no SENAI HUB',
            'message' => 'Seu acesso foi configurado. Faca login e confira seus modulos disponiveis.',
            'action_url' => '/hub',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'actor_user_id' => $actor?->id,
            'severity' => 'info',
        ]);

        $this->notifications->notifyRole(HubRole::ADMIN, [
            'module' => 'hub',
            'type' => 'hub.user.created_admin',
            'title' => 'Novo usuario cadastrado',
            'message' => "{$user->name} ({$user->email}) foi adicionado ao sistema.",
            'action_url' => '/hub/usuarios',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function userRoleUpdated(User $user, ?string $previousRole, ?User $actor = null): void
    {
        $this->notifications->notify($user, [
            'module' => 'hub',
            'type' => 'hub.user.role_updated',
            'title' => 'Perfil de acesso atualizado',
            'message' => 'Suas permissoes ou cargo foram alterados por um administrador.',
            'action_url' => '/perfil',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'actor_user_id' => $actor?->id,
            'metadata' => ['previous_role' => $previousRole, 'role' => $user->role],
            'severity' => 'warning',
        ]);
    }

    public function passwordChanged(User $user): void
    {
        $this->notifications->notify($user, [
            'module' => 'hub',
            'type' => 'hub.auth.password_changed',
            'title' => 'Senha alterada',
            'message' => 'Sua senha foi atualizada com sucesso. Se nao foi voce, avise o administrador.',
            'action_url' => '/configuracoes',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'severity' => 'warning',
        ]);
    }

    public function accessRequestSubmitted(AccessRequest $request): void
    {
        $summary = "{$request->name} ({$request->email}) solicitou acesso ao SENAI HUB.";
        if ($request->organization) {
            $summary .= " Organizacao: {$request->organization}.";
        }

        $this->notifications->notifyRole(HubRole::ADMIN, [
            'module' => 'hub',
            'type' => 'hub.access_request',
            'title' => 'Nova solicitacao de acesso',
            'message' => $summary,
            'action_url' => '/hub/usuarios',
            'entity_type' => 'access_request',
            'entity_id' => $request->id,
            'severity' => 'info',
            'metadata' => [
                'email' => $request->email,
                'organization' => $request->organization,
            ],
        ]);
    }

    public function connectStudentEnrolled(ConnectStudent $student, ?User $actor = null): void
    {
        $student->loadMissing(['connectClass.teacher', 'hubPerson']);
        $class = $student->connectClass;

        if ($student->user_id) {
            $this->notifications->notify((int) $student->user_id, [
                'module' => 'connect',
                'type' => 'connect.student.enrolled',
                'title' => 'Matricula confirmada',
                'message' => $class
                    ? "Voce foi matriculado na turma {$class->name}."
                    : 'Seu cadastro academico foi atualizado.',
                'action_url' => '/connect/turmas',
                'entity_type' => 'student',
                'entity_id' => $student->id,
                'actor_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }

        if ($class?->connect_teacher_id) {
            $teacherUserId = ConnectTeacher::query()->where('id', $class->connect_teacher_id)->value('user_id');
            if ($teacherUserId) {
                $this->notifications->notify((int) $teacherUserId, [
                    'module' => 'connect',
                    'type' => 'connect.student.enrolled_teacher',
                    'title' => 'Novo aluno na turma',
                    'message' => "{$student->full_name} entrou na turma {$class->name}.",
                    'action_url' => '/connect/alunos?class='.$class->id,
                    'entity_type' => 'student',
                    'entity_id' => $student->id,
                    'actor_user_id' => $actor?->id,
                    'except_user_id' => $actor?->id,
                    'severity' => 'info',
                ]);
            }
        }

        $this->notifications->notifyPermission('connect.students.manage', [
            'module' => 'connect',
            'type' => 'connect.student.enrolled_staff',
            'title' => 'Aluno matriculado',
            'message' => "{$student->full_name} cadastrado".($class ? " na turma {$class->name}" : '').'.',
            'action_url' => '/connect/alunos',
            'entity_type' => 'student',
            'entity_id' => $student->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function connectClassAssigned(ConnectClass $class, ?User $actor = null): void
    {
        $class->loadMissing(['course', 'teacher']);

        if ($class->teacher?->user_id) {
            $this->notifications->notify((int) $class->teacher->user_id, [
                'module' => 'connect',
                'type' => 'connect.class.teacher_assigned',
                'title' => 'Turma atribuida a voce',
                'message' => "Voce foi definido como professor da turma {$class->name}.",
                'action_url' => '/connect/turmas',
                'entity_type' => 'class',
                'entity_id' => $class->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }

        ConnectStudent::query()
            ->where('connect_class_id', $class->id)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->each(fn ($userId) => $this->notifications->notify((int) $userId, [
                'module' => 'connect',
                'type' => 'connect.class.updated',
                'title' => 'Turma atualizada',
                'message' => "A turma {$class->name} teve professor ou curso atualizado.",
                'action_url' => '/connect/calendario?class='.$class->id,
                'entity_type' => 'class',
                'entity_id' => $class->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]));
    }

    public function connectCourseRosterAdded(HubPerson $person, string $role, int $courseId, string $courseName, ?User $actor = null): void
    {
        if (! $person->user_id) {
            return;
        }

        $this->notifications->notify((int) $person->user_id, [
            'module' => 'connect',
            'type' => 'connect.course.roster_added',
            'title' => 'Vinculo ao curso',
            'message' => "Voce foi adicionado ao curso {$courseName} como {$role}.",
            'action_url' => '/connect/cursos',
            'entity_type' => 'course',
            'entity_id' => $courseId,
            'actor_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function connectLessonScheduled(ConnectLessonSchedule $lesson, ?User $actor = null): void
    {
        $lesson->loadMissing(['connectClass.teacher', 'connectClass.students']);
        $class = $lesson->connectClass;
        if (! $class) {
            return;
        }

        $date = $lesson->scheduled_date?->format('d/m/Y') ?? '';
        $message = "Aula em {$date} das {$lesson->start_time} as {$lesson->end_time} — {$lesson->subject}.";

        $recipientIds = ConnectStudent::query()
            ->where('connect_class_id', $class->id)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($class->teacher?->user_id) {
            $recipientIds[] = (int) $class->teacher->user_id;
        }

        $this->notifications->notifyMany($recipientIds, [
            'module' => 'connect',
            'type' => 'connect.calendar.lesson_scheduled',
            'title' => "Aula agendada — {$class->name}",
            'message' => $message,
            'action_url' => '/connect/calendario',
            'entity_type' => 'lesson_schedule',
            'entity_id' => $lesson->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function connectLessonCancelled(ConnectLessonSchedule $lesson, ?User $actor = null): void
    {
        $lesson->loadMissing('connectClass');
        $class = $lesson->connectClass;
        if (! $class) {
            return;
        }

        $recipientIds = ConnectStudent::query()
            ->where('connect_class_id', $class->id)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->all();

        if ($class->connect_teacher_id) {
            $teacherUserId = ConnectTeacher::query()->where('id', $class->connect_teacher_id)->value('user_id');
            if ($teacherUserId) {
                $recipientIds[] = $teacherUserId;
            }
        }

        $this->notifications->notifyMany($recipientIds, [
            'module' => 'connect',
            'type' => 'connect.calendar.lesson_cancelled',
            'title' => 'Aula cancelada',
            'message' => "A aula de {$lesson->scheduled_date?->format('d/m/Y')} da turma {$class->name} foi cancelada.",
            'action_url' => '/connect/calendario',
            'entity_type' => 'lesson_schedule',
            'entity_id' => $lesson->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'warning',
        ]);
    }

    public function connectScheduleGenerated(ConnectClass $class, int $createdCount, ?User $actor = null): void
    {
        if ($createdCount < 1) {
            return;
        }

        $class->loadMissing(['teacher']);
        $recipientIds = ConnectStudent::query()
            ->where('connect_class_id', $class->id)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($class->teacher?->user_id) {
            $recipientIds[] = (int) $class->teacher->user_id;
        }

        $this->notifications->notifyMany($recipientIds, [
            'module' => 'connect',
            'type' => 'connect.calendar.schedule_generated',
            'title' => 'Calendario atualizado',
            'message' => "{$createdCount} aula(s) gerada(s) para a turma {$class->name}.",
            'action_url' => '/connect/calendario?class='.$class->id,
            'entity_type' => 'class',
            'entity_id' => $class->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function connectAttendanceSaved(ConnectAttendanceSession $session, ?User $actor = null): void
    {
        $session->loadMissing(['connectClass', 'marks.student']);
        $class = $session->connectClass;
        if (! $class) {
            return;
        }

        $absentCount = $session->marks->where('status', 'absent')->count();
        $total = max(1, $session->marks->count());
        $absentRate = round(($absentCount / $total) * 100, 1);

        if ($absentRate >= 30) {
            $this->notifications->notifyPermission('connect.reports.view', [
                'module' => 'connect',
                'type' => 'connect.attendance.high_absence',
                'title' => 'Alta taxa de faltas',
                'message' => "Chamada {$session->session_date?->format('d/m/Y')} da turma {$class->code}: {$absentRate}% de faltas.",
                'action_url' => '/connect/gerenciar-frequencia',
                'entity_type' => 'attendance_session',
                'entity_id' => $session->id,
                'actor_user_id' => $actor?->id,
                'severity' => 'warning',
            ]);
        }

        foreach ($session->marks as $mark) {
            $student = $mark->student;
            if (! $student?->user_id || $mark->status !== 'absent') {
                continue;
            }

            $summary = ConnectAttendanceStats::studentSummary($student, $class);
            $remaining = $summary['remaining_absences'] ?? null;
            if ($remaining !== null && $remaining <= 2) {
                $this->notifications->notify((int) $student->user_id, [
                    'module' => 'connect',
                    'type' => 'connect.attendance.limit_warning',
                    'title' => 'Atencao ao limite de faltas',
                    'message' => "Restam {$remaining} falta(s) permitidas na turma {$class->name}.",
                    'action_url' => '/connect/frequencia',
                    'entity_type' => 'student',
                    'entity_id' => $student->id,
                    'severity' => 'warning',
                ]);
            }
        }
    }

    public function connectContractCreated(ConnectContract $contract, ?User $actor = null): void
    {
        $contract->loadMissing('student');
        $student = $contract->student;
        if ($student?->user_id) {
            $this->notifications->notify((int) $student->user_id, [
                'module' => 'connect',
                'type' => 'connect.contract.created',
                'title' => 'Novo contrato registrado',
                'message' => "Contrato com {$contract->company_name} cadastrado no sistema.",
                'action_url' => '/connect/contratos/alunos',
                'entity_type' => 'contract',
                'entity_id' => $contract->id,
                'actor_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }

        $this->notifications->notifyPermission('connect.contracts.view', [
            'module' => 'connect',
            'type' => 'connect.contract.created_staff',
            'title' => 'Contrato cadastrado',
            'message' => "Contrato de {$student?->full_name} com {$contract->company_name}.",
            'action_url' => '/connect/contratos/alunos',
            'entity_type' => 'contract',
            'entity_id' => $contract->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function gridTicketCreated(GridTicket $ticket, ?User $actor = null): void
    {
        $this->notifications->notifyRole(HubRole::GRID_CHEFE, [
            'module' => 'grid',
            'type' => 'grid.ticket.created',
            'title' => 'Novo chamado'.($ticket->priority === 'alta' ? ' urgente' : ''),
            'message' => "{$ticket->code}: {$ticket->title} — solicitante {$ticket->requester}.",
            'action_url' => '/grid/chamados',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => $ticket->priority === 'alta' ? 'urgent' : 'info',
        ]);

        $this->notifyGridAssignee($ticket->assignee, [
            'module' => 'grid',
            'type' => 'grid.ticket.assigned',
            'title' => 'Chamado atribuido a voce',
            'message' => "{$ticket->code}: {$ticket->title}",
            'action_url' => '/grid/chamados',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function gridTicketUpdated(
        GridTicket $ticket,
        ?string $previousStatus,
        ?string $previousAssignee,
        ?User $actor = null,
    ): void {
        if ($ticket->assignee && $ticket->assignee !== $previousAssignee) {
            $this->notifyGridAssignee($ticket->assignee, [
                'module' => 'grid',
                'type' => 'grid.ticket.assigned',
                'title' => 'Chamado delegado a voce',
                'message' => "{$ticket->code}: {$ticket->title}",
                'action_url' => '/grid/chamados',
                'entity_type' => 'ticket',
                'entity_id' => $ticket->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }

        if ($ticket->status !== $previousStatus) {
            $this->notifications->notifyRole(HubRole::GRID_CHEFE, [
                'module' => 'grid',
                'type' => 'grid.ticket.status_changed',
                'title' => 'Status do chamado alterado',
                'message' => "{$ticket->code} agora esta em \"{$ticket->status}\".",
                'action_url' => '/grid/chamados',
                'entity_type' => 'ticket',
                'entity_id' => $ticket->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);

            $requesterIds = $this->notifications->userIdsByName($ticket->requester);
            $this->notifications->notifyMany($requesterIds, [
                'module' => 'grid',
                'type' => 'grid.ticket.status_requester',
                'title' => 'Atualizacao do seu chamado',
                'message' => "{$ticket->code} — status: {$ticket->status}.",
                'action_url' => '/grid/chamados',
                'entity_type' => 'ticket',
                'entity_id' => $ticket->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }
    }

    public function gridTicketAwaitingEvaluation(GridTicket $ticket, ?User $actor = null): void
    {
        $requesterIds = $this->notifications->userIdsByName($ticket->requester);
        $this->notifications->notifyMany($requesterIds, [
            'module' => 'grid',
            'type' => 'grid.ticket.awaiting_evaluation',
            'title' => 'Avalie o atendimento',
            'message' => "O chamado {$ticket->code} aguarda sua avaliacao.",
            'action_url' => '/grid/chamados',
            'entity_type' => 'ticket',
            'entity_id' => $ticket->id,
            'actor_user_id' => $actor?->id,
            'severity' => 'warning',
        ]);
    }

    public function gridTaskCreated(GridTask $task, ?User $actor = null): void
    {
        $this->notifyGridAssignee($task->assignee, [
            'module' => 'grid',
            'type' => 'grid.task.assigned',
            'title' => 'Nova tarefa atribuida',
            'message' => "{$task->code}: {$task->title}",
            'action_url' => '/grid/tarefas',
            'entity_type' => 'task',
            'entity_id' => $task->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'info',
        ]);
    }

    public function gridTaskUpdated(GridTask $task, ?string $previousAssignee, ?User $actor = null): void
    {
        if ($task->assignee && $task->assignee !== $previousAssignee) {
            $this->notifyGridAssignee($task->assignee, [
                'module' => 'grid',
                'type' => 'grid.task.assigned',
                'title' => 'Tarefa atribuida a voce',
                'message' => "{$task->code}: {$task->title}",
                'action_url' => '/grid/tarefas',
                'entity_type' => 'task',
                'entity_id' => $task->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }

        if ($task->column === 'concluidas') {
            $this->notifications->notifyRole(HubRole::GRID_CHEFE, [
                'module' => 'grid',
                'type' => 'grid.task.completed',
                'title' => 'Tarefa concluida',
                'message' => "{$task->code}: {$task->title}",
                'action_url' => '/grid/tarefas',
                'entity_type' => 'task',
                'entity_id' => $task->id,
                'actor_user_id' => $actor?->id,
                'except_user_id' => $actor?->id,
                'severity' => 'info',
            ]);
        }
    }

    public function gridInventoryLow(GridInventoryItem $item, ?User $actor = null): void
    {
        if ($item->status !== 'baixo') {
            return;
        }

        $this->notifications->notifyPermission('grid.inventory.view', [
            'module' => 'grid',
            'type' => 'grid.inventory.low_stock',
            'title' => 'Estoque baixo',
            'message' => "{$item->title}: disponivel {$item->qty_available} (minimo {$item->qty_min}).",
            'action_url' => '/grid/estoque',
            'entity_type' => 'inventory_item',
            'entity_id' => $item->id,
            'actor_user_id' => $actor?->id,
            'except_user_id' => $actor?->id,
            'severity' => 'warning',
        ]);
    }

    public function spreadsheetImportFinished(SpreadsheetImportLog $log, ?User $actor = null): void
    {
        if (! $actor) {
            return;
        }

        $module = $log->module === 'grid' ? 'grid' : 'connect';
        $success = ($log->errors_count ?? 0) === 0;
        $processed = (int) ($log->created_count ?? 0) + (int) ($log->updated_count ?? 0);

        $this->notifications->notify($actor, [
            'module' => $module,
            'type' => 'spreadsheet.import_finished',
            'title' => $success ? 'Importacao concluida' : 'Importacao com avisos',
            'message' => "{$log->spreadsheet_key}: {$processed} registro(s) processado(s)".($log->errors_count ? ", {$log->errors_count} erro(s)." : '.'),
            'action_url' => "/{$module}/planilhas",
            'entity_type' => 'spreadsheet_import_log',
            'entity_id' => $log->id,
            'severity' => $success ? 'info' : 'warning',
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function notifyGridAssignee(?string $assigneeName, array $payload): void
    {
        $ids = $this->notifications->userIdsByName($assigneeName);
        if ($ids === []) {
            $this->notifications->notifyRole(HubRole::GRID_FUNCIONARIO, $payload);

            return;
        }

        $this->notifications->notifyMany($ids, $payload);
    }
}
