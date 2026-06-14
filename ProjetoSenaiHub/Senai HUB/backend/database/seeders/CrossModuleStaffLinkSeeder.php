<?php

namespace Database\Seeders;

use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\Grid\GridUser;
use App\Models\HubPerson;
use App\Models\Safe\SafeStudent;
use App\Models\User;
use App\Support\GridParticipantSync;
use App\Support\HubRole;
use Illuminate\Database\Seeder;

class CrossModuleStaffLinkSeeder extends Seeder
{
    public function run(): void
    {
        $this->linkConnectLoginAccounts();
        $this->migrateLegacyGridAssigneeNames();
        $this->linkGridUsersToLoginAccounts();
        $this->ensureHubPeopleForModuleUsers();
        $this->linkSafeStudentsToConnect();
        $this->pruneLegacyModuleRecords();
        $this->syncGridParticipantUserIds();
    }

    private function linkConnectLoginAccounts(): void
    {
        $this->linkConnectStudentUser('maria.aluno@senai.local', '2025AUT0003');
        $this->linkConnectStudentUser('joao.aluno@senai.local', '2025AUT0021');
        $this->linkConnectTeacherUser('carlos.professor@senai.local', 'carlos.professor@senai.local');
        $this->linkConnectTeacherUser('patricia.professor@senai.local', 'patricia.professor@senai.local');
    }

    private function linkConnectStudentUser(string $userEmail, string $registrationNumber): void
    {
        $user = User::query()->where('email', $userEmail)->first();
        $student = ConnectStudent::query()->where('registration_number', $registrationNumber)->first();

        if (! $user || ! $student) {
            return;
        }

        $student->update(['user_id' => $user->id]);

        if ($student->hub_person_id) {
            HubPerson::query()->whereKey($student->hub_person_id)->update(['user_id' => $user->id]);
        }
    }

    private function linkConnectTeacherUser(string $userEmail, string $teacherEmail): void
    {
        $user = User::query()->where('email', $userEmail)->first();
        $teacher = ConnectTeacher::query()->where('email', $teacherEmail)->first();

        if (! $user || ! $teacher) {
            return;
        }

        $teacher->update(['user_id' => $user->id]);

        if ($teacher->hub_person_id) {
            HubPerson::query()->whereKey($teacher->hub_person_id)->update(['user_id' => $user->id]);
        }
    }

    private function linkGridUsersToLoginAccounts(): void
    {
        foreach (GridUser::query()->cursor() as $gridUser) {
            $user = User::query()
                ->where('email', $gridUser->email)
                ->orWhere('name', $gridUser->name)
                ->first();

            if (! $user) {
                continue;
            }

            $gridUser->update([
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ]);
        }
    }

    private function migrateLegacyGridAssigneeNames(): void
    {
        $map = [
            'Júlio Oliveira' => 'Pedro Tecnico',
            'Maria Santos' => 'Julia Tecnica',
            'Carlos Mendes' => 'Joao Gerente Manutencao',
            'Roberto Alves' => 'Carlos Chefe Manutencao',
        ];

        foreach ($map as $from => $to) {
            GridTicket::query()->where('assignee', $from)->update(['assignee' => $to]);
            GridTask::query()->where('assignee', $from)->update(['assignee' => $to]);
            GridTicket::query()->where('requester', $from)->update(['requester' => $to]);
            GridTask::query()->where('opened_by', $from)->update(['opened_by' => $to]);
        }
    }

    private function pruneLegacyModuleRecords(): void
    {
        GridUser::query()
            ->whereNull('user_id')
            ->where('email', 'not like', '%@grid.senai.local')
            ->delete();

        SafeStudent::query()
            ->whereNull('connect_student_id')
            ->where('registration', 'like', '202400%')
            ->delete();
    }

    private function ensureHubPeopleForModuleUsers(): void
    {
        $staffUsers = User::query()
            ->whereIn('role', [
                HubRole::GRID_CHEFE,
                HubRole::GRID_FUNCIONARIO,
                HubRole::GRID_PROFESSOR,
                HubRole::GRID_SECRETARIA,
                HubRole::CONNECT_PROFESSOR,
                HubRole::CONNECT_SECRETARIA,
                HubRole::CONNECT_DIRETOR,
                HubRole::CONNECT_AQV,
                HubRole::SAFE_AQV,
                HubRole::SAFE_PROFESSOR,
                HubRole::SAFE_PORTARIA,
            ])
            ->get();

        foreach ($staffUsers as $user) {
            $kind = match (HubRole::moduleFor($user->role)) {
                'connect' => in_array($user->role, [HubRole::CONNECT_PROFESSOR], true) ? 'teacher' : 'staff',
                'grid' => 'staff',
                'safe' => 'staff',
                default => 'staff',
            };

            $person = HubPerson::query()->updateOrCreate(
                ['email' => $user->email],
                [
                    'kind' => $kind,
                    'user_id' => $user->id,
                    'full_name' => $user->name,
                    'status' => 'active',
                ],
            );

            GridUser::query()
                ->where('user_id', $user->id)
                ->update(['hub_person_id' => $person->id]);

            ConnectTeacher::query()
                ->where('user_id', $user->id)
                ->whereNull('hub_person_id')
                ->update(['hub_person_id' => $person->id]);

            ConnectTeacher::query()
                ->where('email', $user->email)
                ->whereNull('user_id')
                ->update(['user_id' => $user->id, 'hub_person_id' => $person->id]);
        }

        foreach (ConnectTeacher::query()->whereNotNull('hub_person_id')->cursor() as $teacher) {
            if ($teacher->user_id) {
                HubPerson::query()
                    ->whereKey($teacher->hub_person_id)
                    ->whereNull('user_id')
                    ->update(['user_id' => $teacher->user_id]);
            }
        }
    }

    private function linkSafeStudentsToConnect(): void
    {
        foreach (SafeStudent::query()->cursor() as $safeStudent) {
            $connectStudent = ConnectStudent::query()
                ->with('connectClass')
                ->where('registration_number', $safeStudent->registration)
                ->first();

            if (! $connectStudent) {
                continue;
            }

            $safeStudent->update([
                'connect_student_id' => $connectStudent->id,
                'name' => $connectStudent->full_name,
                'class_name' => $connectStudent->connectClass?->code ?? $safeStudent->class_name,
            ]);
        }
    }

    private function syncGridParticipantUserIds(): void
    {
        foreach (GridTicket::query()->cursor() as $ticket) {
            $payload = [
                'requester' => $ticket->requester,
                'assignee' => $ticket->assignee,
            ];
            GridParticipantSync::syncTicket($payload);
            $ticket->update([
                'requester_user_id' => $payload['requester_user_id'] ?? null,
                'assignee_user_id' => $payload['assignee_user_id'] ?? null,
            ]);
        }

        foreach (GridTask::query()->cursor() as $task) {
            $payload = [
                'opened_by' => $task->opened_by,
                'assignee' => $task->assignee,
            ];
            GridParticipantSync::syncTask($payload);
            $task->update([
                'opened_by_user_id' => $payload['opened_by_user_id'] ?? null,
                'assignee_user_id' => $payload['assignee_user_id'] ?? null,
            ]);
        }
    }
}
