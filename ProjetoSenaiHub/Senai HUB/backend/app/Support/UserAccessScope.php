<?php

namespace App\Support;

use App\Models\Connect\ConnectAttendanceMark;
use App\Models\Connect\ConnectClass;
use App\Models\Connect\ConnectStudent;
use App\Models\Connect\ConnectTeacher;
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

        if ($user->role === HubRole::CONNECT_PROFESSOR) {
            $teacherId = ConnectTeacher::query()->where('user_id', $user->id)->value('id');
            if ($teacherId) {
                $query->where('connect_teacher_id', $teacherId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return $query;
    }

    public static function attendanceMarkQuery(User $user): Builder
    {
        $query = ConnectAttendanceMark::query();

        return match ($user->role) {
            HubRole::CONNECT_ALUNO => $query->whereHas('student', fn (Builder $q) => $q->where('user_id', $user->id)),
            HubRole::CONNECT_EMPRESA => $query->whereHas('student.contracts', function (Builder $q) use ($user): void {
                if ($user->company_name) {
                    $q->where('company_name', $user->company_name);
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
}
