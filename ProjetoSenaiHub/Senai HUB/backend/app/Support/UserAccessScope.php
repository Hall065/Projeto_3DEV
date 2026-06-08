<?php

namespace App\Support;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectContract;
use App\Models\Connect\ConnectCourse;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
use App\Models\Grid\GridTask;
use App\Models\Grid\GridTicket;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class UserAccessScope
{
    public static function connectStudentQuery(User $user): Builder
    {
        $query = ConnectStudent::query();

        return match ($user->role) {
            HubRole::CONNECT_ALUNO => $query->where('user_id', $user->id),
            HubRole::CONNECT_EMPRESA => $query->whereHas('contracts', function (Builder $q) use ($user): void {
                if ($user->company_name) {
                    $q->where('company_name', $user->company_name);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            HubRole::CONNECT_PROFESSOR => $query->whereHas('connectClass', function (Builder $q) use ($user): void {
                $teacherId = ConnectTeacher::query()->where('user_id', $user->id)->value('id');
                if ($teacherId) {
                    $q->where('connect_teacher_id', $teacherId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            default => $query,
        };
    }

    public static function connectClassQuery(User $user): Builder
    {
        $query = ConnectClass::query();

        return match ($user->role) {
            HubRole::CONNECT_ALUNO => $query->whereHas('students', fn (Builder $q) => $q->where('user_id', $user->id)),
            HubRole::CONNECT_PROFESSOR => $query->where(function (Builder $q) use ($user): void {
                $teacherId = ConnectTeacher::query()->where('user_id', $user->id)->value('id');
                if ($teacherId) {
                    $q->where('connect_teacher_id', $teacherId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            default => $query,
        };
    }

    public static function connectCourseQuery(User $user): Builder
    {
        $query = ConnectCourse::query();

        if ($user->role === HubRole::CONNECT_ALUNO) {
            $query->whereHas('classes.students', fn (Builder $q) => $q->where('user_id', $user->id));
        }

        return $query;
    }

    public static function connectTeacherQuery(User $user): Builder
    {
        $query = ConnectTeacher::query();

        if ($user->role === HubRole::CONNECT_ALUNO) {
            $query->whereHas('classes.students', fn (Builder $q) => $q->where('user_id', $user->id));
        }

        return $query;
    }

    public static function connectContractQuery(User $user): Builder
    {
        $query = ConnectContract::query();

        return match ($user->role) {
            HubRole::CONNECT_ALUNO => $query->whereHas('student', fn (Builder $q) => $q->where('user_id', $user->id)),
            HubRole::CONNECT_EMPRESA => $query->where(function (Builder $q) use ($user): void {
                if ($user->company_name) {
                    $q->where('company_name', $user->company_name);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            default => $query,
        };
    }

    public static function attendanceMarkQuery(User $user): Builder
    {
        $query = ConnectAttendanceMark::query();

        return match ($user->role) {
            HubRole::CONNECT_ALUNO => $query->whereHas('student', fn (Builder $q) => $q->where('user_id', $user->id)),
            HubRole::CONNECT_EMPRESA => $query->whereHas('student.contracts', function (Builder $q) use ($user): void {
                if ($user->company_name) {
                    $q->where('company_name', $user->company_name);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            HubRole::CONNECT_PROFESSOR => $query->whereHas('session.connectClass', function (Builder $q) use ($user): void {
                $teacherId = ConnectTeacher::query()->where('user_id', $user->id)->value('id');
                if ($teacherId) {
                    $q->where('connect_teacher_id', $teacherId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            }),
            default => $query,
        };
    }

    public static function gridTicketQuery(User $user): Builder
    {
        $query = GridTicket::query();

        return match ($user->role) {
            HubRole::GRID_FUNCIONARIO => $query->where('assignee', $user->name),
            HubRole::GRID_PROFESSOR, HubRole::GRID_SECRETARIA => $query->where('requester', $user->name),
            default => $query,
        };
    }

    public static function gridTaskQuery(User $user): Builder
    {
        $query = GridTask::query();

        return match ($user->role) {
            HubRole::GRID_FUNCIONARIO => $query->where('assignee', $user->name),
            HubRole::GRID_PROFESSOR, HubRole::GRID_SECRETARIA => $query->where('opened_by', $user->name),
            default => $query,
        };
    }

    public static function canAccessGridTicket(User $user, GridTicket $ticket): bool
    {
        if (HubRole::isAdmin($user->role) || $user->role === HubRole::GRID_CHEFE) {
            return true;
        }

        return self::gridTicketQuery($user)->whereKey($ticket->id)->exists();
    }

    public static function canAccessGridTask(User $user, GridTask $task): bool
    {
        if (HubRole::isAdmin($user->role) || $user->role === HubRole::GRID_CHEFE) {
            return true;
        }

        return self::gridTaskQuery($user)->whereKey($task->id)->exists();
    }
}
